import { EmbedColors, type UsingClient } from 'seyfert';
import { sql } from '../../database/connection.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { parseDurationMs } from '../shared/Duration.js';

/**
 * Turns raidmode off automatically once its configured duration elapses. A per-guild `setTimeout`,
 * not a periodic poll — raidmode is expected to be active on a handful of guilds at most, so scanning
 * the whole table on a timer would waste cycles for something this rare. Kept in sync the same way
 * `GuildConfigCache` is: a second listener on the same `guild_config_changed` Postgres channel
 * (`sql.listen` supports more than one, each fires independently) reschedules a guild's timer
 * whenever its config changes, and a one-time sweep at startup covers whatever changed while the bot
 * was offline/disconnected — same reasoning as `AntiraidSystem.recheckAllPrerequisites`.
 */
export class RaidmodeExpiry {
    private static timers = new Map<string, NodeJS.Timeout>();
    private static listening = false;

    /**
     * Starts listening for config changes (once ever) and runs the sweep. Call from `ready` on
     * every fresh gateway session, not just the first — same reasoning as
     * `AntiraidSystem.recheckAllPrerequisites`: that's the only signal telling us we might have
     * missed something while disconnected, and the sweep is what actually catches it. The listener
     * itself only needs registering once, hence the separate guard.
     */
    static start(client: UsingClient): void {
        if (!RaidmodeExpiry.listening) {
            RaidmodeExpiry.listening = true;
            void sql.listen('guild_config_changed', (guildId) => {
                void RaidmodeExpiry.reschedule(client, guildId).catch((error) =>
                    client.logger.error(`[raidmode] Failed to reschedule guild ${guildId} after a config change`, error)
                );
            });
        }

        void RaidmodeExpiry.sweep(client).catch((error) => client.logger.error('[raidmode] Sweep failed', error));
    }

    /** Re-checks every currently-enabled guild — covers drift from while the bot was offline/disconnected. */
    private static async sweep(client: UsingClient): Promise<void> {
        const guildIds = await GuildRepository.listRaidmodeEnabledGuildIds();
        for (const guildId of guildIds) {
            await RaidmodeExpiry.reschedule(client, guildId);
        }
    }

    /** Re-reads one guild's raidmode state and (re)schedules its timer, or just clears it if raidmode is off. */
    private static async reschedule(client: UsingClient, guildId: string): Promise<void> {
        const existing = RaidmodeExpiry.timers.get(guildId);
        if (existing) clearTimeout(existing);
        RaidmodeExpiry.timers.delete(guildId);

        const state = await GuildRepository.getRaidmodeState(guildId);
        if (!state?.raidmodeEnable || !state.raidmodeActivatedAt) return;

        const durationMs = parseDurationMs(state.raidmodeTimeToDisable);
        const delay = Math.max(0, state.raidmodeActivatedAt.getTime() + durationMs - Date.now());

        const timer = setTimeout(() => {
            RaidmodeExpiry.timers.delete(guildId);
            void RaidmodeExpiry.expire(client, guildId).catch((error) => client.logger.error(`[raidmode] Failed to auto-disable guild ${guildId}`, error));
        }, delay);

        RaidmodeExpiry.timers.set(guildId, timer);
    }

    /** Turns raidmode off and logs it — this UPDATE fires the same trigger that got us here, but `reschedule()` no-ops on an already-disabled guild, so there's no loop. */
    private static async expire(client: UsingClient, guildId: string): Promise<void> {
        await GuildRepository.updateProtection(guildId, { raidmodeEnable: false, raidmodeActivatedAt: null });

        void dispatchLog(
            client,
            new ServerEventLog(guildId, {
                type: ServerEventType.RaidmodeExpired,
                color: EmbedColors.Green,
                describe: (t) => t.systems.logs.events.raidmodeExpired().get()
            })
        ).catch(() => {});
    }
}

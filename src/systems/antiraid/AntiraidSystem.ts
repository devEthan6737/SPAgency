import { AuditLogEvent, EmbedColors, type UsingClient } from 'seyfert';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { IntelligentSosSystem } from '../intelligent-sos/index.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { AntiraidPrerequisites } from './AntiraidPrerequisites.js';
import { BurstTracker } from './BurstTracker.js';

export interface AntiraidDetectOptions {
    client: UsingClient;
    guildId: string;
    executorId: string;
    /** How much this action counts toward the burst threshold — see {@link AntiraidSystem.weightFor}. Defaults to 1. */
    weight?: number;
}

interface WeighableAuditLogEntry {
    guildId: string;
    actionType: AuditLogEvent;
    targetId: string | null;
    changes?: { key: string; newValue?: unknown }[];
}

/**
 * Detects raid-style bursts (channels/roles spammed or deleted, mass bans) and bans whoever's
 * behind them. One shared counter per guild — a raid mixing channel and role spam still trips it,
 * matching the legacy bot's behavior.
 */
export class AntiraidSystem {
    /** How many flagged actions within the window count as a raid. */
    private static readonly BurstThreshold = 3;
    /** Rolling window: each new flagged action resets it, so the threshold is "N actions within this long of each other". */
    private static readonly BurstWindowMs = 10_000;

    /** Call for a flagged audit log entry (channel/role create-delete, ban add) — `executorId` comes straight off the gateway payload, no REST lookup needed. */
    static async detect({ client, guildId, executorId, weight = 1 }: AntiraidDetectOptions): Promise<void> {
        if (executorId === client.botId) return;

        const settings = await GuildConfigCache.get(guildId);
        if (!settings?.antiraidEnable) return;
        if (settings.whitelist.includes(executorId)) return;

        const tripped = BurstTracker.hit({
            key: guildId,
            threshold: AntiraidSystem.BurstThreshold,
            windowMs: AntiraidSystem.BurstWindowMs,
            weight
        });
        if (!tripped) return;

        const t = client.t(settings.language);
        const reason = t.systems.antiraid.banReason.get();
        await client.bans.create(guildId, executorId, { reason }).catch(() => {});

        void dispatchLog(client, AntiraidSystem.log({ guildId, targetId: executorId })).catch(() => {});
        void IntelligentSosSystem.trigger(client, guildId, reason).catch(() => {});
    }

    /**
     * How much a flagged audit log entry should count toward the burst threshold. Everything is
     * worth 1 hit except a channel created with the same name as one that already exists — raiders
     * commonly clone/duplicate channel names when spamming — which counts double so the detector
     * trips sooner. A false positive here (an admin genuinely naming two channels the same) is far
     * cheaper than missing a real raid.
     */
    static async weightFor(client: UsingClient, entry: WeighableAuditLogEntry): Promise<number> {
        if (entry.actionType !== AuditLogEvent.ChannelCreate) return 1;

        const newName = entry.changes?.find((change) => change.key === 'name')?.newValue;
        if (typeof newName !== 'string') return 1;

        const channels = (client.cache.channels?.values(entry.guildId)) ?? [];
        const isDuplicate = channels.some((channel) => channel.id !== entry.targetId && 'name' in channel && channel.name === newName);

        return isDuplicate ? 2 : 1;
    }

    private static log({ guildId, targetId }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.RaidDetected,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.raidDetected(targetId).get(),
            targetId
        });
    }

    /**
     * Re-checks {@link AntiraidPrerequisites} for one guild and disables antiraid if it no longer
     * holds. Call whenever something that could break it happens — a role's position/permissions
     * change, a role gets deleted, or the bot's own roles change (see `src/events/guildRoleUpdate.ts`,
     * `guildRoleDelete.ts`, `guildMemberUpdate.ts`) — not on a timer.
     */
    static async recheckPrerequisites(client: UsingClient, guildId: string): Promise<void> {
        const settings = await GuildConfigCache.get(guildId);
        if (!settings?.antiraidEnable) return;

        const meets = await AntiraidPrerequisites.meets(client, guildId);
        if (!meets) await AntiraidSystem.disable(client, guildId);
    }

    /** Re-checks every antiraid-enabled guild — call from `ready` (fires on every fresh gateway session, not just process start) to catch drift from while the bot was offline/disconnected that no event could have told it about. */
    static async recheckAllPrerequisites(client: UsingClient): Promise<void> {
        const guildIds = await GuildRepository.listAntiraidEnabledGuildIds();
        for (const guildId of guildIds) {
            await AntiraidSystem.recheckPrerequisites(client, guildId);
        }
    }

    /** Turns antiraid off because the bot no longer meets its prerequisites, and logs it. */
    private static async disable(client: UsingClient, guildId: string): Promise<void> {
        await GuildRepository.updateProtection(guildId, { antiraidEnable: false });
        void dispatchLog(client, AntiraidSystem.logDisabled(guildId)).catch(() => {});
    }

    private static logDisabled(guildId: string) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.AntiraidDisabled,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.antiraidDisabled().get()
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
}

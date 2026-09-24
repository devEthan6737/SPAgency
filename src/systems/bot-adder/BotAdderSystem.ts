import { EmbedColors, type UsingClient } from 'seyfert';
import { BotAdderRepository } from '../../database/repositories/bot-adder.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';

/** Which system caught the raider bot — carried through only for the log's `data.source`. */
export enum RaidBotSource {
    Raidmode = 'raidmode',
    MaliciousMember = 'maliciousMember',
    Antiraid = 'antiraid'
}

/**
 * Bans whoever added a bot that just got banned as a raider — see docs/moderation.md for why this
 * reads `BotAdderRepository` (populated live off the `BOT_ADD` audit entry, cleared once the bot
 * leaves) instead of searching Discord's own audit log at ban time. No whitelist exemption, unlike
 * `AntiraidSystem`: adding a bot that turns out to be a raider is on the adder, staff or not.
 *
 * Call after the bot itself is already banned — `botId` must still identify a bot that was actually
 * removed for raiding, never call this speculatively.
 */
export class BotAdderSystem {
    /** Records who added a bot, off a live `BOT_ADD` audit log entry — see `src/events/guildAuditLogEntryCreate.ts`. */
    static track(guildId: string, botId: string, executorId: string): Promise<unknown> {
        return BotAdderRepository.record(guildId, botId, executorId);
    }

    /** Drops the record once the bot leaves — see `src/events/guildMemberRemove.ts`. Nothing left to attribute after this. */
    static untrack(guildId: string, botId: string): Promise<unknown> {
        return BotAdderRepository.delete(guildId, botId);
    }

    /**
     * Bans whoever added `botId`, if a live-tracked record exists — a no-op otherwise (no fallback to
     * Discord's own audit log, see docs/bot-adder.md). Skips the bot's own account and the case where
     * the recorded adder is no longer resolvable.
     * @param client Bot client.
     * @param hit The guild and bot the ban happened in, and which system caught it.
     */
    static async enforce(client: UsingClient, { guildId, botId, source }: RaidBotHit): Promise<void> {
        const executorId = await BotAdderRepository.findAdder(guildId, botId);
        if (!executorId || executorId === client.botId) return;

        const settings = await GuildConfigCache.get(guildId);
        if (!settings) return;

        const t = client.t(settings.language);
        await client.bans.create(guildId, executorId, { reason: t.systems.raidBotAdder.banReason(botId).get() }).catch(() => {});

        void dispatchLog(client, BotAdderSystem.log({ guildId, targetId: executorId, botId, source })).catch(() => {});
    }

    private static log({ guildId, targetId, botId, source }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.RaidBotAdderBan,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.raidBotAdderBan(targetId, botId).get(),
            targetId,
            data: { botId, source }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    botId: string;
    source: RaidBotSource;
}

/** What {@link BotAdderSystem.enforce} needs to identify a raid-bot ban. */
export interface RaidBotHit {
    /** Guild the bot was banned in. */
    guildId: string;
    /** The banned bot's id. */
    botId: string;
    /** Which system caught it. */
    source: RaidBotSource;
}

import { AuditLogEvent, EmbedColors, type GuildMemberStructure, type UsingClient } from 'seyfert';
import { TempbanRepository } from '../../database/repositories/tempban.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';

interface RaidmodeAuditEntry {
    guildId: string;
    userId: string;
    actionType: AuditLogEvent;
}

/**
 * Manual "lockdown" the server owner turns on because they already suspect trouble — see
 * docs/raidmode.md for the full reasoning. Zero threshold, no whitelist, and while active it
 * substitutes for antiraid/antibots/`MaliciousMemberSystem`/normal event logging entirely instead of
 * running alongside them: both entry points below run this first and skip everything else when it acts.
 */
export class RaidmodeSystem {
    /** Audit log actions this cares about — same set `AntiraidSystem` watches, plus adding a bot (too noisy a signal for antiraid's default burst detection, but raidmode has zero tolerance by design). Exposed so `guildAuditLogEntryCreate.ts` can gate the call without duplicating the list. */
    static readonly AuditActions = new Set<AuditLogEvent>([
        AuditLogEvent.ChannelCreate,
        AuditLogEvent.ChannelDelete,
        AuditLogEvent.ChannelUpdate,
        AuditLogEvent.RoleCreate,
        AuditLogEvent.RoleDelete,
        AuditLogEvent.MemberBanAdd,
        AuditLogEvent.MemberBanRemove,
        AuditLogEvent.BotAdd
    ]);

    /** @returns Whether it temp-banned `member` — the caller should skip every other join-time system when this is `true`. */
    static async enforceJoin(client: UsingClient, member: GuildMemberStructure): Promise<boolean> {
        if (member.id === client.botId) return false;

        const settings = await GuildConfigCache.get(member.guildId);
        if (!settings?.raidmodeEnable) return false;

        const guild = await client.guilds.fetch(member.guildId).catch(() => undefined);
        if (guild && member.id === guild.ownerId) return false;

        const t = client.t(settings.language);
        const reason = t.systems.raidmode.joinBanReason.get();
        const expiresAt = new Date(Date.now() + RaidmodeSystem.parseDurationMs(settings.raidmodeTimeToDisable));

        await client.bans.create(member.guildId, member.id, { reason }).catch(() => {});
        await TempbanRepository.create(member.guildId, member.id, reason, expiresAt);

        void dispatchLog(client, RaidmodeSystem.logJoinBan({ guildId: member.guildId, targetId: member.id })).catch(() => {});
        return true;
    }

    /** @returns Whether it banned the entry's executor — the caller should skip antiraid and normal event logging for this entry when this is `true`. */
    static async enforceAuditEntry(client: UsingClient, entry: RaidmodeAuditEntry): Promise<boolean> {
        if (!RaidmodeSystem.AuditActions.has(entry.actionType) || entry.userId === client.botId) return false;

        const settings = await GuildConfigCache.get(entry.guildId);
        if (!settings?.raidmodeEnable) return false;

        const guild = await client.guilds.fetch(entry.guildId).catch(() => undefined);
        if (guild && entry.userId === guild.ownerId) return false;

        const t = client.t(settings.language);
        await client.bans.create(entry.guildId, entry.userId, { reason: t.systems.raidmode.actionBanReason.get() }).catch(() => {});

        void dispatchLog(client, RaidmodeSystem.logActionBan({ guildId: entry.guildId, targetId: entry.userId })).catch(() => {});
        return true;
    }

    /** `'1d'`/`'30m'`/... → ms. Falls back to a day if `value` doesn't parse — better a safe default than an instant expiry. */
    private static parseDurationMs(value: string): number {
        const unitsMs: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
        const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(value.trim());
        if (!match) return unitsMs.d;

        return Number(match[1]) * unitsMs[match[2].toLowerCase()];
    }

    private static logJoinBan({ guildId, targetId }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.RaidmodeJoinBan,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.raidmodeJoinBan(targetId).get(),
            targetId
        });
    }

    private static logActionBan({ guildId, targetId }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.RaidmodeActionBan,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.raidmodeActionBan(targetId).get(),
            targetId
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
}

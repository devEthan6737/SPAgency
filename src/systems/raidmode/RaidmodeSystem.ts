import { AuditLogEvent, EmbedColors, type GuildMemberStructure, type UsingClient } from 'seyfert';
import { TempbanRepository } from '../../database/repositories/tempban.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { parseDurationMs } from '../shared/Duration.js';

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
        const expiresAt = new Date(Date.now() + parseDurationMs(settings.raidmodeTimeToDisable));

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

import { EmbedColors, type GuildMemberStructure, type SeyfertLocale, type UsingClient } from 'seyfert';
import { MaliciousMemberAction } from '../../database/schema/guild-protection.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { getUbfb } from '../ubfb/client.js';

/**
 * Reacts to a known malicious user (per UBFB) joining, per `guild_protection.maliciousMemberAction`
 * — see docs/malicious-members.md for the full reasoning behind each case.
 */
export class MaliciousMemberSystem {
    static async enforce(client: UsingClient, member: GuildMemberStructure): Promise<void> {
        const ubfb = getUbfb();
        if (!ubfb.isBlacklisted(member.id)) return;

        const settings = await GuildConfigCache.get(member.guildId);
        if (!settings) return;

        const entry = ubfb.getCachedEntry(member.id) ?? (await ubfb.getBlacklistEntry(member.id).catch(() => null));
        const reason = entry?.reason ?? 'Malicious user';
        const t = client.t(settings.language);

        // A malicious bot bypasses the configured action entirely and always gets banned — there's
        // no legitimate reason to mark-and-let-in or do nothing about a bot that's both on the
        // global blacklist and, on top of that, managed to get past AntibotsSystem.
        const action = member.bot ? MaliciousMemberAction.Ban : settings.maliciousMemberAction;

        if (action === MaliciousMemberAction.Mark) {
            await MaliciousMemberSystem.notifyOwner(client, member.guildId, t.systems.maliciousMember.ownerDmMark(member.id, reason).get());
            await client.members.edit(member.guildId, member.id, { nick: `${member.user.username} (${reason})` }).catch(() => {});
        } else if (action === MaliciousMemberAction.Ban) {
            await MaliciousMemberSystem.notifyOwner(client, member.guildId, t.systems.maliciousMember.ownerDmBan(member.id, reason).get());
            await client.bans.create(member.guildId, member.id, { reason }).catch(() => {});
        }

        void dispatchLog(client, MaliciousMemberSystem.log({ guildId: member.guildId, targetId: member.id, action })).catch(() => {});
    }

    /** DMs the server owner, if the bot can reach them — never worth failing the rest of the flow over. */
    private static async notifyOwner(client: UsingClient, guildId: string, content: string): Promise<void> {
        const guild = await client.guilds.fetch(guildId).catch(() => undefined);
        if (!guild) return;

        const owner = await client.users.fetch(guild.ownerId).catch(() => undefined);
        await owner?.write({ content }).catch(() => {});
    }

    private static log({ guildId, targetId, action }: LogInput) {
        const byAction = {
            [MaliciousMemberAction.None]: { color: EmbedColors.Grey, describe: (t: SeyfertLocale) => t.systems.logs.events.maliciousMemberNone(targetId).get() },
            [MaliciousMemberAction.Mark]: { color: EmbedColors.Orange, describe: (t: SeyfertLocale) => t.systems.logs.events.maliciousMemberMark(targetId).get() },
            [MaliciousMemberAction.Ban]: { color: EmbedColors.Red, describe: (t: SeyfertLocale) => t.systems.logs.events.maliciousMemberBan(targetId).get() }
        }[action];

        return new ServerEventLog(guildId, {
            type: ServerEventType.MaliciousMemberJoin,
            color: byAction.color,
            describe: byAction.describe,
            targetId,
            data: { action }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    action: MaliciousMemberAction;
}

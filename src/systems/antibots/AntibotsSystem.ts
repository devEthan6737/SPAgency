import { EmbedColors, UserFlags, type GuildMemberStructure, type UsingClient } from 'seyfert';
import { AntibotsType } from '../../database/schema/guild-protection.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';

/**
 * Kicks bots joining a protected server. `All` kicks every bot; `OnlyUnverified` only kicks bots
 * Discord hasn't reviewed — the real threat, since a Discord-verified bot is the least suspicious
 * kind. A "kick only verified bots" mode existed in the legacy bot but made no security sense, so
 * it wasn't carried over.
 */
export class AntibotsSystem {
    /** @returns Whether this call kicked `member` — `guildMemberAdd.ts` skips `SelfbotSystem` when this is `true`, since a bot that's already gone has nothing left to score. */
    static async enforce(client: UsingClient, member: GuildMemberStructure): Promise<boolean> {
        if (!member.bot) return false;

        const settings = await GuildConfigCache.get(member.guildId);
        if (!settings?.antibotsEnable) return false;
        if (settings.antibotsType === AntibotsType.OnlyUnverified && AntibotsSystem.isVerified(member)) return false;

        const t = client.t(settings.language);
        await client.members.kick(member.guildId, member.user.id, t.systems.antibots.kickReason.get()).catch(() => {});

        void dispatchLog(client, AntibotsSystem.log({ guildId: member.guildId, targetId: member.user.id })).catch(() => {});
        return true;
    }

    /** Whether Discord has reviewed and verified this bot. */
    private static isVerified(member: GuildMemberStructure): boolean {
        return ((member.user.publicFlags ?? 0) & UserFlags.VerifiedBot) === UserFlags.VerifiedBot;
    }

    private static log({ guildId, targetId }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.AntibotsKick,
            color: EmbedColors.Orange,
            describe: (t) => t.systems.logs.events.antibotsKick(targetId).get(),
            targetId
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
}

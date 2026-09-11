import type { UsingClient } from 'seyfert';
import { sql } from '../../database/connection.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import type { AutomodFinalAction } from '../../database/schema/guild-moderation.js';
import type { AntibotsType, MaliciousMemberAction, SelfbotAction } from '../../database/schema/guild-protection.js';

export interface GuildSettings {
    language: string;
    antiraidEnable: boolean;
    whitelist: string[];
    antibotsEnable: boolean;
    antibotsType: AntibotsType;
    selfbotAction: SelfbotAction;
    selfbotMinAccountAge: string;
    maliciousMemberAction: MaliciousMemberAction;
    verificationEnable: boolean;
    verificationRole: string | null;
    intelligentSosEnable: boolean;
    raidmodeEnable: boolean;
    raidmodeTimeToDisable: string;
    logsChannel: string | null;
    antiflood: boolean;
    antiWebhooksFlood: boolean;
    antiWebhooksFloodRememberOwner: string;
    ghostpingEnable: boolean;
    capsLockEnable: boolean;
    capsLockThreshold: number;
    manyEmojisEnable: boolean;
    manyEmojisThreshold: number;
    manyWordsEnable: boolean;
    manyWordsThreshold: number;
    automodMuteAt: number;
    automodMuteMinutes: number;
    automodFinalAction: AutomodFinalAction;
    automodFinalActionAt: number;
}

/**
 * In-memory mirror of every per-guild setting the message/join/audit-log-time systems need — antiraid,
 * antibots, `AutomodSystem`'s thresholds, `dispatchLog`'s needs (`language`, `logsChannel`) — so none
 * of those hot paths ever touch the network for this. Kept fresh by a Postgres LISTEN — the trigger
 * fires regardless of who wrote the change (this bot, or later the dashboard, a separate process), so
 * the cache stays correct without either side having to remember to invalidate it. Four tables feed
 * this cache (`guild_protection`, `guild_configuration`, `guild_moderation`, and `guilds` for
 * `language`), each with its own trigger — see their schema files for the exact trigger names.
 */
export class GuildConfigCache {
    private static entries = new Map<string, GuildSettings>();
    private static listening = false;

    /** Starts the LISTEN connection and the periodic safety-net refresh. Call once, from the ready event. */
    static start(client: UsingClient): void {
        if (GuildConfigCache.listening) return;
        GuildConfigCache.listening = true;

        void sql.listen('guild_config_changed', (guildId) => GuildConfigCache.invalidate(guildId)).catch((error) => {
            client.logger.error('[protection] Failed to start the guild_config_changed listener', error);
        });
        setInterval(() => GuildConfigCache.entries.clear(), 10 * 60 * 1000);
    }

    /** Cached settings for `guildId`, fetching and caching them on a miss. */
    static async get(guildId: string): Promise<GuildSettings | null> {
        const cached = GuildConfigCache.entries.get(guildId);
        if (cached) return cached;

        const settings = await GuildRepository.getGuildSettings(guildId);
        if (settings) GuildConfigCache.entries.set(guildId, settings);
        return settings;
    }

    /** Reads whatever is currently cached for `guildId` without ever touching the network — `undefined` on a miss, unlike {@link GuildConfigCache.get}, which would fetch. For `/cache info`. */
    static peek(guildId: string): GuildSettings | undefined {
        return GuildConfigCache.entries.get(guildId);
    }

    /** Drops `guildId`'s cached entry, if any, so the next {@link GuildConfigCache.get} is a guaranteed miss. For `/cache hit`/`reload`, and reused internally by the `guild_config_changed` listener. */
    static invalidate(guildId: string): void {
        GuildConfigCache.entries.delete(guildId);
    }
}

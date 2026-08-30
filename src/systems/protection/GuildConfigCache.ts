import type { UsingClient } from 'seyfert';
import { sql } from '../../database/connection.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import type { AntibotsType, MaliciousMemberAction, SelfbotAction } from '../../database/schema/guild-protection.js';

export interface GuildProtectionSettings {
    language: string;
    antiraidEnable: boolean;
    whitelist: string[];
    antibotsEnable: boolean;
    antibotsType: AntibotsType;
    selfbotAction: SelfbotAction;
    selfbotMinAccountAge: string;
    maliciousMemberAction: MaliciousMemberAction;
    raidmodeEnable: boolean;
    raidmodeTimeToDisable: string;
    logsChannel: string | null;
}

/**
 * In-memory mirror of the join/audit-log-time guild protection settings (antiraid, antibots...) and
 * of `dispatchLog`'s own needs (`language`, `logsChannel`), so neither the detection hot paths nor
 * every single logged action ever touch the network for this. Kept fresh by a Postgres LISTEN — the
 * trigger fires regardless of who wrote the change (this bot, or later the dashboard, a separate
 * process), so the cache stays correct without either side having to remember to invalidate it.
 * Three tables feed this cache (`guild_protection`, `guild_configuration`, and `guilds` for
 * `language`), each with its own trigger — see their schema files for the exact trigger names.
 */
export class GuildConfigCache {
    private static entries = new Map<string, GuildProtectionSettings>();
    private static listening = false;

    /** Starts the LISTEN connection and the periodic safety-net refresh. Call once, from the ready event. */
    static start(client: UsingClient): void {
        if (GuildConfigCache.listening) return;
        GuildConfigCache.listening = true;

        void sql.listen('guild_config_changed', (guildId) => GuildConfigCache.entries.delete(guildId)).catch((error) => {
            client.logger.error('[protection] Failed to start the guild_config_changed listener', error);
        });
        setInterval(() => GuildConfigCache.entries.clear(), 10 * 60 * 1000);
    }

    /** Cached settings for `guildId`, fetching and caching them on a miss. */
    static async get(guildId: string): Promise<GuildProtectionSettings | null> {
        const cached = GuildConfigCache.entries.get(guildId);
        if (cached) return cached;

        const settings = await GuildRepository.getProtectionSettings(guildId);
        if (settings) GuildConfigCache.entries.set(guildId, settings);
        return settings;
    }
}

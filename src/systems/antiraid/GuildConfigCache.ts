import type { UsingClient } from 'seyfert';
import { sql } from '../../database/connection.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';

export interface AntiraidSettings {
    language: string;
    antiraidEnable: boolean;
    whitelist: string[];
}

/**
 * In-memory mirror of the antiraid-relevant guild settings, so the detection hot path never
 * touches the network. Kept fresh by a Postgres LISTEN — the trigger fires regardless of who wrote
 * the change (this bot, or later the dashboard, a separate process), so the cache stays correct
 * without either side having to remember to invalidate it.
 */
export class GuildConfigCache {
    private static entries = new Map<string, AntiraidSettings>();
    private static listening = false;

    /** Starts the LISTEN connection and the periodic safety-net refresh. Call once, from the ready event. */
    static start(client: UsingClient): void {
        if (GuildConfigCache.listening) return;
        GuildConfigCache.listening = true;

        void sql.listen('guild_config_changed', (guildId) => GuildConfigCache.entries.delete(guildId)).catch((error) => {
            client.logger.error('[antiraid] Failed to start the guild_config_changed listener', error);
        });
        setInterval(() => GuildConfigCache.entries.clear(), 10 * 60 * 1000);
    }

    /** Cached settings for `guildId`, fetching and caching them on a miss. */
    static async get(guildId: string): Promise<AntiraidSettings | null> {
        const cached = GuildConfigCache.entries.get(guildId);
        if (cached) return cached;

        const settings = await GuildRepository.getAntiraidSettings(guildId);
        if (settings) GuildConfigCache.entries.set(guildId, settings);
        return settings;
    }
}

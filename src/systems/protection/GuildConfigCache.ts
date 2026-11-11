import type { UsingClient } from 'seyfert';
import { sql } from '../../database/connection.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import type { AutomodFinalAction } from '../../database/schema/guild-moderation.js';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import type { AntibotsType, MaliciousMemberAction, SelfbotAction } from '../../database/schema/guild-protection.js';

/** Shape of a guild's cached settings — one field per column {@link GuildConfigCache} needs from `guild_protection`, `guild_configuration`, `guild_moderation`, and `guilds` (`language`). */
export interface GuildSettings {
    language: string;
    /** Message-command prefix of the guild. */
    prefix: string;
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
    /** Safety net against a missed notification: every entry is re-read this long after it was loaded, each on its own clock so nothing expires all at once. */
    private static readonly EntryTtlMs = 10 * 60 * 1000;
    /** How long "this guild has no row" is remembered, so a stream of events from an unregistered guild doesn't hit the database each time. */
    private static readonly MissTtlMs = 30 * 1000;

    private static entries = new ExpiringMap<string, GuildSettings>();
    private static misses = new ExpiringMap<string, true>();
    private static loading = new Map<string, Promise<GuildSettings | null>>();
    private static listening = false;

    /** Starts the LISTEN connection. Call once, from the ready event. */
    static start(client: UsingClient): void {
        if (GuildConfigCache.listening) return;
        GuildConfigCache.listening = true;

        void sql.listen('guild_config_changed', (guildId) => GuildConfigCache.invalidate(guildId)).catch((error) => {
            client.logger.error('[protection] Failed to start the guild_config_changed listener', error);
        });
    }

    /** Cached settings for `guildId`, fetching and caching them on a miss. Concurrent callers for the same guild share one query, and a guild with no row is remembered briefly as such. */
    static async get(guildId: string): Promise<GuildSettings | null> {
        const cached = GuildConfigCache.entries.get(guildId);
        if (cached) return cached;
        if (GuildConfigCache.misses.has(guildId)) return null;

        const pending = GuildConfigCache.loading.get(guildId);
        if (pending) return await pending;

        const load = GuildConfigCache.load(guildId).finally(() => GuildConfigCache.loading.delete(guildId));
        GuildConfigCache.loading.set(guildId, load);
        return await load;
    }

    /**
     * Reads a guild's settings from the database and caches them, or caches that the guild has no row.
     * @param guildId The guild to load.
     * @returns Its settings, or `null` if it has no row.
     */
    private static async load(guildId: string): Promise<GuildSettings | null> {
        const settings = await GuildRepository.getGuildSettings(guildId);

        if (settings) GuildConfigCache.entries.set(guildId, settings, { ttlMs: GuildConfigCache.EntryTtlMs });
        else GuildConfigCache.misses.set(guildId, true, { ttlMs: GuildConfigCache.MissTtlMs });

        return settings;
    }

    /** Reads whatever is currently cached for `guildId` without ever touching the network — `undefined` on a miss, unlike {@link GuildConfigCache.get}, which would fetch. For `/cache info`. */
    static peek(guildId: string): GuildSettings | undefined {
        return GuildConfigCache.entries.get(guildId);
    }

    /** Drops `guildId`'s cached entry (and any remembered "no row"), if any, so the next {@link GuildConfigCache.get} is a guaranteed miss. For `/cache hit`/`reload`, for a guild row that was just created, and reused internally by the `guild_config_changed` listener. */
    static invalidate(guildId: string): void {
        GuildConfigCache.entries.delete(guildId);
        GuildConfigCache.misses.delete(guildId);
    }
}

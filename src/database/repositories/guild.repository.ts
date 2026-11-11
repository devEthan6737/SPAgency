import { and, eq, isNotNull, inArray, isNull, lt } from 'drizzle-orm';
import { db } from '../connection.js';
import { guildConfiguration } from '../schema/guild-configuration.js';
import { AutomodFinalAction, guildModeration } from '../schema/guild-moderation.js';
import { type AntibotsType, type MaliciousMemberAction, type SelfbotAction, guildProtection } from '../schema/guild-protection.js';
import { guilds } from '../schema/guild.js';

/** Full per-guild configuration, joined from the four `guild*` tables. */
export interface GuildConfig {
    core: typeof guilds.$inferSelect;
    protection: typeof guildProtection.$inferSelect;
    moderation: typeof guildModeration.$inferSelect;
    configuration: typeof guildConfiguration.$inferSelect;
}

/** Static-method repository spanning `guilds`, `guild_protection`, `guild_moderation` and `guild_configuration`. */
export class GuildRepository {
    /**
     * Lean lookup backing `GuildConfigCache` — avoids the full joined get(). Covers the join/audit-log
     * protection systems (antiraid, antibots...), `AutomodSystem`'s message-time settings, and the log
     * dispatcher's needs (`language`, `logsChannel`) — all read from the same cached row per guild.
     */
    static async getGuildSettings(id: string): Promise<{
        language: string;
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
    } | null> {
        const [row] = await db
            .select({
                language: guilds.language,
                prefix: guilds.prefix,
                antiraidEnable: guildProtection.antiraidEnable,
                whitelist: guildConfiguration.whitelist,
                antibotsEnable: guildProtection.antibotsEnable,
                antibotsType: guildProtection.antibotsType,
                selfbotAction: guildProtection.selfbotAction,
                selfbotMinAccountAge: guildProtection.selfbotMinAccountAge,
                maliciousMemberAction: guildProtection.maliciousMemberAction,
                verificationEnable: guildProtection.verificationEnable,
                verificationRole: guildProtection.verificationRole,
                intelligentSosEnable: guildProtection.intelligentSosEnable,
                raidmodeEnable: guildProtection.raidmodeEnable,
                raidmodeTimeToDisable: guildProtection.raidmodeTimeToDisable,
                logsChannel: guildConfiguration.logsChannel,
                antiflood: guildModeration.antiflood,
                antiWebhooksFlood: guildModeration.antiWebhooksFlood,
                ghostpingEnable: guildModeration.ghostpingEnable,
                capsLockEnable: guildModeration.capsLockEnable,
                capsLockThreshold: guildModeration.capsLockThreshold,
                manyEmojisEnable: guildModeration.manyEmojisEnable,
                manyEmojisThreshold: guildModeration.manyEmojisThreshold,
                manyWordsEnable: guildModeration.manyWordsEnable,
                manyWordsThreshold: guildModeration.manyWordsThreshold,
                automodMuteAt: guildModeration.automodMuteAt,
                automodMuteMinutes: guildModeration.automodMuteMinutes,
                automodFinalAction: guildModeration.automodFinalAction,
                automodFinalActionAt: guildModeration.automodFinalActionAt
            })
            .from(guilds)
            .innerJoin(guildProtection, eq(guildProtection.guildId, guilds.id))
            .innerJoin(guildConfiguration, eq(guildConfiguration.guildId, guilds.id))
            .innerJoin(guildModeration, eq(guildModeration.guildId, guilds.id))
            .where(eq(guilds.id, id));

        return row ?? null;
    }

    /** Lean list for the antiraid prerequisites check — only the guild ids with antiraid turned on. */
    static async listAntiraidEnabledGuildIds(): Promise<string[]> {
        const rows = await db.select({ guildId: guildProtection.guildId }).from(guildProtection).where(eq(guildProtection.antiraidEnable, true));
        return rows.map((row) => row.guildId);
    }

    /** Lean list for `RaidmodeExpiry`'s startup sweep — only the guild ids with raidmode turned on. */
    static async listRaidmodeEnabledGuildIds(): Promise<string[]> {
        const rows = await db.select({ guildId: guildProtection.guildId }).from(guildProtection).where(eq(guildProtection.raidmodeEnable, true));
        return rows.map((row) => row.guildId);
    }

    /** Lean lookup for `RaidmodeExpiry` — avoids the full joined get(). */
    static async getRaidmodeState(
        id: string
    ): Promise<{ raidmodeEnable: boolean; raidmodeTimeToDisable: string; raidmodeActivatedAt: Date | null } | null> {
        const [row] = await db
            .select({
                raidmodeEnable: guildProtection.raidmodeEnable,
                raidmodeTimeToDisable: guildProtection.raidmodeTimeToDisable,
                raidmodeActivatedAt: guildProtection.raidmodeActivatedAt
            })
            .from(guildProtection)
            .where(eq(guildProtection.guildId, id));

        return row ?? null;
    }

    /** Single-column lookup for `ForceReasons` — avoids the full joined get(). */
    static async getForceReasons(id: string): Promise<string[]> {
        const [row] = await db.select({ forceReasons: guildModeration.forceReasons }).from(guildModeration).where(eq(guildModeration.guildId, id));
        return row?.forceReasons ?? [];
    }

    /**
     * Full joined configuration for a guild across all four `guild*` tables.
     * @param id Guild id.
     * @returns The guild's {@link GuildConfig}, or `null` if it has no row (never registered / deleted).
     */
    static async get(id: string): Promise<GuildConfig | null> {
        const [row] = await db
            .select()
            .from(guilds)
            .innerJoin(guildProtection, eq(guildProtection.guildId, guilds.id))
            .innerJoin(guildModeration, eq(guildModeration.guildId, guilds.id))
            .innerJoin(guildConfiguration, eq(guildConfiguration.guildId, guilds.id))
            .where(eq(guilds.id, id));

        if (!row) return null;

        return {
            core: row.guilds,
            protection: row.guild_protection,
            moderation: row.guild_moderation,
            configuration: row.guild_configuration
        };
    }

    /**
     * Returns the guild's existing configuration, or creates a fresh row (with defaults) in each of
     * the four `guild*` tables when it doesn't have one yet.
     * @param id Guild id.
     * @param ownerId Discord user id of the guild owner, used only on first creation.
     * @returns The guild's {@link GuildConfig}, existing or newly created.
     */
    static async findOrCreate(id: string, ownerId: string): Promise<GuildConfig> {
        const existing = await GuildRepository.get(id);
        if (existing) {
            if (existing.core.leftAt) await GuildRepository.updateCore(id, { leftAt: null });
            return existing;
        }

        await db.transaction(async (tx) => {
            await tx.insert(guilds).values({ id, ownerId });
            await tx.insert(guildProtection).values({ guildId: id });
            await tx.insert(guildModeration).values({ guildId: id });
            await tx.insert(guildConfiguration).values({ guildId: id });
        });

        return (await GuildRepository.get(id))!;
    }

    /**
     * Partially updates a guild's `guilds` row (id, owner, prefix, language).
     * @param id Guild id.
     * @param patch Columns to change.
     * @returns The updated row(s).
     */
    static updateCore(id: string, patch: Partial<typeof guilds.$inferInsert>) {
        return db.update(guilds).set(patch).where(eq(guilds.id, id)).returning();
    }

    /**
     * Partially updates a guild's `guild_protection` row.
     * @param id Guild id.
     * @param patch Columns to change.
     * @returns The updated row(s).
     */
    static updateProtection(id: string, patch: Partial<typeof guildProtection.$inferInsert>) {
        return db.update(guildProtection).set(patch).where(eq(guildProtection.guildId, id)).returning();
    }

    /**
     * Partially updates a guild's `guild_moderation` row.
     * @param id Guild id.
     * @param patch Columns to change.
     * @returns The updated row(s).
     */
    static updateModeration(id: string, patch: Partial<typeof guildModeration.$inferInsert>) {
        return db.update(guildModeration).set(patch).where(eq(guildModeration.guildId, id)).returning();
    }

    /**
     * Partially updates a guild's `guild_configuration` row.
     * @param id Guild id.
     * @param patch Columns to change.
     * @returns The updated row(s).
     */
    static updateConfiguration(id: string, patch: Partial<typeof guildConfiguration.$inferInsert>) {
        return db.update(guildConfiguration).set(patch).where(eq(guildConfiguration.guildId, id)).returning();
    }

    /**
     * Flags the bot as no longer being in the guild; the row (and its backup) stays until {@link GuildRepository.purgeLeftBefore} runs.
     * @param id The guild id.
     * @returns The update, already running.
     */
    static markLeft(id: string) {
        return db.update(guilds).set({ leftAt: new Date() }).where(and(eq(guilds.id, id), isNull(guilds.leftAt)));
    }

    /**
     * Every stored guild id, with whether it is currently flagged as left, for the startup membership sync.
     * @returns One entry per stored guild.
     */
    static async listMembership(): Promise<{ id: string; left: boolean }[]> {
        const rows = await db.select({ id: guilds.id, leftAt: guilds.leftAt }).from(guilds);
        return rows.map((row) => ({ id: row.id, left: row.leftAt !== null }));
    }

    /**
     * Flags the given guilds as left, for the ones the bot was removed from while it was offline.
     * @param ids The ids of the stored guilds the bot is no longer in.
     * @returns The update, already running (or `undefined` if there was nothing to flag).
     */
    static markLeftMany(ids: string[]) {
        if (!ids.length) return;
        return db.update(guilds).set({ leftAt: new Date() }).where(and(isNull(guilds.leftAt), inArray(guilds.id, ids)));
    }

    /**
     * Deletes the rows of guilds the bot left before `cutoff`; protection, moderation, configuration and backups cascade with them.
     * @param cutoff Guilds flagged as left before this moment are deleted.
     * @returns The ids of the deleted guilds.
     */
    static purgeLeftBefore(cutoff: Date) {
        return db.delete(guilds).where(and(isNotNull(guilds.leftAt), lt(guilds.leftAt, cutoff))).returning({ id: guilds.id });
    }
}

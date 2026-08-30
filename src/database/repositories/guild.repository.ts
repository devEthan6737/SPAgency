import { eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { guildConfiguration } from '../schema/guild-configuration.js';
import { guildModeration } from '../schema/guild-moderation.js';
import { type AntibotsType, type MaliciousMemberAction, type SelfbotAction, guildProtection } from '../schema/guild-protection.js';
import { guilds } from '../schema/guild.js';

export interface GuildConfig {
    core: typeof guilds.$inferSelect;
    protection: typeof guildProtection.$inferSelect;
    moderation: typeof guildModeration.$inferSelect;
    configuration: typeof guildConfiguration.$inferSelect;
}

export class GuildRepository {
    /** Single-column lookup for the message prefix handler, avoids the full joined get(). */
    static async getPrefix(id: string): Promise<string | null> {
        const [row] = await db.select({ prefix: guilds.prefix }).from(guilds).where(eq(guilds.id, id));
        return row?.prefix ?? null;
    }

    /**
     * Lean lookup backing `GuildConfigCache` — avoids the full joined get(). Covers both the
     * join-time protection systems (antiraid, antibots...) and the log dispatcher's needs
     * (`language`, `logsChannel`), since both are read from the same cached row per guild.
     */
    static async getProtectionSettings(id: string): Promise<{
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
    } | null> {
        const [row] = await db
            .select({
                language: guilds.language,
                antiraidEnable: guildProtection.antiraidEnable,
                whitelist: guildConfiguration.whitelist,
                antibotsEnable: guildProtection.antibotsEnable,
                antibotsType: guildProtection.antibotsType,
                selfbotAction: guildProtection.selfbotAction,
                selfbotMinAccountAge: guildProtection.selfbotMinAccountAge,
                maliciousMemberAction: guildProtection.maliciousMemberAction,
                raidmodeEnable: guildProtection.raidmodeEnable,
                raidmodeTimeToDisable: guildProtection.raidmodeTimeToDisable,
                logsChannel: guildConfiguration.logsChannel
            })
            .from(guilds)
            .innerJoin(guildProtection, eq(guildProtection.guildId, guilds.id))
            .innerJoin(guildConfiguration, eq(guildConfiguration.guildId, guilds.id))
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

    static async findOrCreate(id: string, ownerId: string): Promise<GuildConfig> {
        const existing = await GuildRepository.get(id);
        if (existing) return existing;

        await db.transaction(async (tx) => {
            await tx.insert(guilds).values({ id, ownerId });
            await tx.insert(guildProtection).values({ guildId: id });
            await tx.insert(guildModeration).values({ guildId: id });
            await tx.insert(guildConfiguration).values({ guildId: id });
        });

        return (await GuildRepository.get(id))!;
    }

    static updateCore(id: string, patch: Partial<typeof guilds.$inferInsert>) {
        return db.update(guilds).set(patch).where(eq(guilds.id, id)).returning();
    }

    static updateProtection(id: string, patch: Partial<typeof guildProtection.$inferInsert>) {
        return db.update(guildProtection).set(patch).where(eq(guildProtection.guildId, id)).returning();
    }

    static updateModeration(id: string, patch: Partial<typeof guildModeration.$inferInsert>) {
        return db.update(guildModeration).set(patch).where(eq(guildModeration.guildId, id)).returning();
    }

    static updateConfiguration(id: string, patch: Partial<typeof guildConfiguration.$inferInsert>) {
        return db.update(guildConfiguration).set(patch).where(eq(guildConfiguration.guildId, id)).returning();
    }

    /** Deletes the guild row — protection/moderation/configuration/backups cascade with it. */
    static delete(id: string) {
        return db.delete(guilds).where(eq(guilds.id, id)).returning();
    }
}

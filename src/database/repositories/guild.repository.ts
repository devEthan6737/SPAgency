import { eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { guildConfiguration } from '../schema/guild-configuration.js';
import { guildModeration } from '../schema/guild-moderation.js';
import { type AntibotsType, guildProtection } from '../schema/guild-protection.js';
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

    /** Lean lookup for the log dispatcher — avoids the full joined get(). */
    static async getLogSettings(id: string): Promise<{ language: string; logsEnable: boolean; logsChannel: string | null } | null> {
        const [row] = await db
            .select({
                language: guilds.language,
                logsEnable: guildConfiguration.logsEnable,
                logsChannel: guildConfiguration.logsChannel
            })
            .from(guilds)
            .innerJoin(guildConfiguration, eq(guildConfiguration.guildId, guilds.id))
            .where(eq(guilds.id, id));

        return row ?? null;
    }

    /** Lean lookup for the join-time protection systems (antiraid, antibots...) — avoids the full joined get(), and skips guildModeration entirely. */
    static async getProtectionSettings(id: string): Promise<{
        language: string;
        antiraidEnable: boolean;
        whitelist: string[];
        antibotsEnable: boolean;
        antibotsType: AntibotsType;
    } | null> {
        const [row] = await db
            .select({
                language: guilds.language,
                antiraidEnable: guildProtection.antiraidEnable,
                whitelist: guildConfiguration.whitelist,
                antibotsEnable: guildProtection.antibotsEnable,
                antibotsType: guildProtection.antibotsType
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

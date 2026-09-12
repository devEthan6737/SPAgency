import { and, eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { botAdders } from '../schema/bot-adder.js';

/** Static-method repository for the `bot_adders` table — one row per bot currently in a guild. */
export class BotAdderRepository {
    /** Overwrites any previous adder for this bot — if it was re-added, the latest add is the one that matters. */
    static record(guildId: string, botId: string, executorId: string) {
        return db
            .insert(botAdders)
            .values({ guildId, botId, executorId })
            .onConflictDoUpdate({ target: [botAdders.guildId, botAdders.botId], set: { executorId, addedAt: new Date() } });
    }

    /**
     * Looks up who added a bot to a guild.
     * @param guildId Guild the bot is in.
     * @param botId Bot to look up.
     * @returns The adder's user id, or `null` if there's no recorded entry.
     */
    static async findAdder(guildId: string, botId: string): Promise<string | null> {
        const [row] = await db
            .select({ executorId: botAdders.executorId })
            .from(botAdders)
            .where(and(eq(botAdders.guildId, guildId), eq(botAdders.botId, botId)));
        return row?.executorId ?? null;
    }

    /** Removes a bot's adder record, e.g. once the bot leaves the guild. */
    static delete(guildId: string, botId: string) {
        return db.delete(botAdders).where(and(eq(botAdders.guildId, guildId), eq(botAdders.botId, botId)));
    }
}

import { and, eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { botAdders } from '../schema/bot-adder.js';

export class BotAdderRepository {
    /** Overwrites any previous adder for this bot — if it was re-added, the latest add is the one that matters. */
    static record(guildId: string, botId: string, executorId: string) {
        return db
            .insert(botAdders)
            .values({ guildId, botId, executorId })
            .onConflictDoUpdate({ target: [botAdders.guildId, botAdders.botId], set: { executorId, addedAt: new Date() } });
    }

    static async findAdder(guildId: string, botId: string): Promise<string | null> {
        const [row] = await db
            .select({ executorId: botAdders.executorId })
            .from(botAdders)
            .where(and(eq(botAdders.guildId, guildId), eq(botAdders.botId, botId)));
        return row?.executorId ?? null;
    }

    static delete(guildId: string, botId: string) {
        return db.delete(botAdders).where(and(eq(botAdders.guildId, guildId), eq(botAdders.botId, botId)));
    }
}

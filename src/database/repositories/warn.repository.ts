import { and, eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { warns } from '../schema/warn.js';

export class WarnRepository {
    static create(guildId: string, userId: string, moderatorId: string, reason: string) {
        return db.insert(warns).values({ guildId, userId, moderatorId, reason }).returning();
    }

    static list(guildId: string, userId: string) {
        return db
            .select()
            .from(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId)))
            .orderBy(warns.createdAt);
    }

    static deleteById(guildId: string, userId: string, id: number) {
        return db
            .delete(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId), eq(warns.id, id)))
            .returning();
    }

    static deleteAll(guildId: string, userId: string) {
        return db
            .delete(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId)))
            .returning();
    }
}

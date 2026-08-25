import { eq, lte } from 'drizzle-orm';
import { db } from '../connection.js';
import { tempbans } from '../schema/tempban.js';

export class TempbanRepository {
    static create(guildId: string, userId: string, reason: string, expiresAt: Date) {
        return db.insert(tempbans).values({ guildId, userId, reason, expiresAt }).returning();
    }

    /** Every temp-ban whose expiry has already passed — what the poller acts on. */
    static listExpired(now: Date = new Date()) {
        return db.select().from(tempbans).where(lte(tempbans.expiresAt, now));
    }

    static delete(id: number) {
        return db.delete(tempbans).where(eq(tempbans.id, id));
    }
}

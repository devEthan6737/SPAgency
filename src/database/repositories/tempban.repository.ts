import { eq, lte } from 'drizzle-orm';
import { db } from '../connection.js';
import { tempbans } from '../schema/tempban.js';

/** Static-method repository for the `tempbans` table — one row per active temporary ban. */
export class TempbanRepository {
    /**
     * Creates a temp-ban record.
     * @param guildId Guild the ban applies to.
     * @param userId Banned user's id.
     * @param reason Ban reason.
     * @param expiresAt When the ban should be lifted.
     * @returns The created row(s).
     */
    static create(guildId: string, userId: string, reason: string, expiresAt: Date) {
        return db.insert(tempbans).values({ guildId, userId, reason, expiresAt }).returning();
    }

    /** Every temp-ban whose expiry has already passed — what the poller acts on. */
    static listExpired(now: Date = new Date()) {
        return db.select().from(tempbans).where(lte(tempbans.expiresAt, now));
    }

    /**
     * Removes a temp-ban record once it's been lifted.
     * @param id Row id, as returned by {@link TempbanRepository.create} or {@link TempbanRepository.listExpired}.
     */
    static delete(id: number) {
        return db.delete(tempbans).where(eq(tempbans.id, id));
    }
}

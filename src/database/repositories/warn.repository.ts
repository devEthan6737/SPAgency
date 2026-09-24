import { and, count, eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { warns } from '../schema/warn.js';

/** Static-method repository for the `warns` table — one row per warning issued. */
export class WarnRepository {
    /**
     * `moderatorId` for a warning `AutomodSystem` issues on its own — no Discord user behind it, but
     * `moderatorId` has no FK and every consumer of `warns` (`/warns`, this repository) already treats it
     * as free text, so a sentinel string is enough. Warnings tagged with this still show up in `/warns`
     * for accountability, same as a human-issued one — see docs/moderation.md.
     */
    static AutomodModeratorId = 'SP Agency';

    /**
     * Creates a warning.
     * @param warn Guild, user, issuer and reason of the warning — `moderatorId` is {@link WarnRepository.AutomodModeratorId} for automod.
     * @returns The created row(s).
     */
    static create(warn: { guildId: string; userId: string; moderatorId: string; reason: string }) {
        return db.insert(warns).values(warn).returning();
    }

    /**
     * How many of a user's warnings came from `AutomodSystem` — computed from `warns` itself
     * (`moderatorId = AutomodModeratorId`), not a separate stored counter, so it can never drift from
     * the actual history. This is the count `AutomodSystem`'s escalation ladder acts on.
     */
    static async countAutomod(guildId: string, userId: string): Promise<number> {
        const [row] = await db
            .select({ total: count() })
            .from(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId), eq(warns.moderatorId, WarnRepository.AutomodModeratorId)));

        return row?.total ?? 0;
    }

    /**
     * All of a user's warnings in a guild, oldest first.
     * @param guildId Guild to look in.
     * @param userId User whose warnings to list.
     */
    static list(guildId: string, userId: string) {
        return db
            .select()
            .from(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId)))
            .orderBy(warns.createdAt);
    }

    /**
     * Deletes a single warning by id, scoped to the guild and user it belongs to.
     * @param guildId Guild the warning was issued in.
     * @param userId Warned user's id.
     * @param id Warning row id.
     * @returns The deleted row(s).
     */
    static deleteById(guildId: string, userId: string, id: number) {
        return db
            .delete(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId), eq(warns.id, id)))
            .returning();
    }

    /**
     * Deletes every warning a user has in a guild.
     * @param guildId Guild to clear warnings in.
     * @param userId User whose warnings to delete.
     * @returns The deleted row(s).
     */
    static deleteAll(guildId: string, userId: string) {
        return db
            .delete(warns)
            .where(and(eq(warns.guildId, guildId), eq(warns.userId, userId)))
            .returning();
    }
}

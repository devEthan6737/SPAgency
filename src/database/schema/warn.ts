import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/** One row per warning issued, not per user. */
export const warns = pgTable('warns', {
    /** Row id. */
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    /** Server this warning was issued in. */
    guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    /** The warned user's id. */
    userId: text('user_id').notNull(),
    /** Why the user was warned. */
    reason: text('reason').notNull(),
    /** Who issued the warning — a user id, or `WarnRepository.AutomodModeratorId` for automod. */
    moderatorId: text('moderator_id').notNull(),
    /** When the warning was issued. */
    createdAt: timestamp('created_at').notNull().defaultNow()
});

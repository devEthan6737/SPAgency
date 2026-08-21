import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const warns = pgTable('warns', {
    // one row per warning, not per user (comandos/Moderacion/warn.js hace push a una lista)
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    // server this warning was issued in
    guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    // the warned user's id
    userId: text('user_id').notNull(),
    // why the user was warned
    reason: text('reason').notNull(),
    // who issued the warning
    moderatorId: text('moderator_id').notNull(),
    // when the warning was issued
    createdAt: timestamp('created_at').notNull().defaultNow()
});

import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/** One row per active temp-ban, deleted once it's lifted. */
export const tempbans = pgTable(
    'tempbans',
    {
        /** Row id. */
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        /** Guild the ban applies to. */
        guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
        /** Banned user's id. */
        userId: text('user_id').notNull(),
        /** Ban reason. */
        reason: text('reason').notNull(),
        /** When the ban should be lifted — polled periodically, see `src/systems/tempban`. */
        expiresAt: timestamp('expires_at').notNull(),
        /** When the ban was created. */
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [index('tempbans_expires_at_idx').on(table.expiresAt)]
);

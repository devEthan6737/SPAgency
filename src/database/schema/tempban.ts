import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const tempbans = pgTable(
    'tempbans',
    {
        // one row per active temp-ban, deleted once it's lifted
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
        userId: text('user_id').notNull(),
        reason: text('reason').notNull(),
        // polled periodically — see src/systems/tempban
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow()
    },
    (table) => [index('tempbans_expires_at_idx').on(table.expiresAt)]
);

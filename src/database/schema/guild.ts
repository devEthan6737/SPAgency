import { pgTable, text } from 'drizzle-orm/pg-core';

export const guilds = pgTable('guilds', {
    // discord server id
    id: text('id').primaryKey(),
    // discord user id of the server owner
    ownerId: text('owner_id').notNull(),
    // command prefix for this server
    prefix: text('prefix').notNull().default('sp!'),
    // language used for bot replies in this server
    language: text('language').notNull().default('es')
});

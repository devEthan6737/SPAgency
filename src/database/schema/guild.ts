import { pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Any `UPDATE` on this table fires `guilds_notify_config_changed` — a Postgres trigger (see
 * `drizzle/0018_guilds_notify_config_changed.sql`, not represented here since Drizzle's schema
 * builder has no declarative way to express triggers) that does `pg_notify('guild_config_changed',
 * NEW.id)`. A separate trigger function from `guild_protection`/`guild_configuration`'s, since this
 * table's primary key is `id`, not `guild_id`. `GuildConfigCache` listens on the same channel either
 * way — see docs/antiraid.md section 2.
 */
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

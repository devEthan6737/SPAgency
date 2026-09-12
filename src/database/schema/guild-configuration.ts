import { pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/**
 * Any `UPDATE` on this table fires `guild_configuration_notify_config_changed` — a Postgres trigger
 * (see `drizzle/0000_baseline.sql`, not represented here since Drizzle's schema builder has no
 * declarative way to express triggers) that does `pg_notify('guild_config_changed', guild_id)`.
 * `GuildConfigCache` and `RaidmodeExpiry` both `LISTEN` on that channel to invalidate/reschedule
 * without polling — see docs/antiraid.md section 2.
 */
export const guildConfiguration = pgTable('guild_configuration', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

    // users/bots exempt from the protection systems
    whitelist: text('whitelist').array().notNull().default([]),

    // channel logs are sent to, if any — every log is always saved regardless of this;
    // it only gates whether a live embed also goes to a channel. No separate on/off flag:
    // unset the channel to turn it off, same as the legacy bot never had one either.
    logsChannel: text('logs_channel')
});

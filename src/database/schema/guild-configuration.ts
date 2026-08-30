import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const guildConfiguration = pgTable('guild_configuration', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

    // users/bots exempt from the protection systems
    whitelist: text('whitelist').array().notNull().default([]),
    // channels ignored by moderation filters
    ignoreChannels: text('ignore_channels').array().notNull().default([]),

    // channel logs are sent to, if any — every log is always saved regardless of this;
    // it only gates whether a live embed also goes to a channel. No separate on/off flag:
    // unset the channel to turn it off, same as the legacy bot never had one either.
    logsChannel: text('logs_channel'),

    // 2fa: locks bot commands behind a password (2fa.js)
    passwordEnable: boolean('password_enable').notNull().default(false),
    password: text('password').notNull().default(''),
    passwordUsersWithAccess: text('password_users_with_access').array().notNull().default([])
});

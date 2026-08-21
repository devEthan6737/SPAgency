import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const guildConfiguration = pgTable('guild_configuration', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

    // users/bots exempt from the protection systems
    whitelist: text('whitelist').array().notNull().default([]),
    // channel ids where bot logs (bans, raid detections...) are sent
    logs: text('logs').array().notNull().default([]),
    // channels ignored by moderation filters
    ignoreChannels: text('ignore_channels').array().notNull().default([]),

    // 2fa: locks bot commands behind a password (2fa.js)
    passwordEnable: boolean('password_enable').notNull().default(false),
    password: text('password').notNull().default(''),
    passwordUsersWithAccess: text('password_users_with_access').array().notNull().default([]),

    // how much detail the `comandos` command shows: 'lessDetails' | 'moreDetails' | 'twoOptions'
    showDetailsInCmdsCommand: text('show_details_in_cmds_command').notNull().default('lessDetails'),
    // how much detail the bot's ping/mention reply shows: 'allDetails' | 'pingLessDetails' | 'onlySupportServer'
    pingMessage: text('ping_message').notNull().default('allDetails')
});

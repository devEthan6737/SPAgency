import { boolean, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';
import type { BackupBan, BackupChannel, BackupRole } from './backup.types.js';

export const backups = pgTable('backups', {
    // one backup per server (comandos/Moderacion/backup.js hace findOne por guildId, nunca hay más de uno)
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    // is backup enabled?
    enable: boolean('enable').notNull().default(true),
    // the password to modify /// load the backup
    password: text('password'),

    // the name of the guild
    name: text('name'),
    // guild icon
    icon: text('icon'),
    // categories
    channelsCategory: jsonb('channels_category').$type<BackupChannel[]>().notNull().default([]),
    // channels
    channelsText: jsonb('channels_text').$type<BackupChannel[]>().notNull().default([]),
    // channels with no category
    channelsNoCategory: jsonb('channels_no_category').$type<BackupChannel[]>().notNull().default([]),
    // guild roles
    roles: jsonb('roles').$type<BackupRole[]>().notNull().default([]),
    // guild bans
    bans: jsonb('bans').$type<BackupBan[]>().notNull().default([])
});

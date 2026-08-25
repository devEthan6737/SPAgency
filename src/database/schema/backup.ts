import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { APIBan, APIOverwrite, APIRole, ChannelType } from 'seyfert';
import { guilds } from './guild.js';

export interface BackupChannel {
    name: string;
    type: ChannelType;
    rawPosition: number;
    nsfw?: boolean;
    topic?: string | null;
    parent?: string;
    permissionOverwrites: APIOverwrite[];
}

export interface BackupRole extends Pick<APIRole, 'name' | 'hoist' | 'permissions' | 'mentionable'> {
    colors: { primaryColor: number; secondaryColor: number | null; tertiaryColor: number | null };
    rawPosition: number;
}

export interface BackupBan extends Pick<APIBan, 'reason'> {
    id: string;
}

export interface BackupEmoji {
    name: string;
    /** Base64-encoded image data, no `data:` prefix. */
    image: string;
}

export interface BackupSticker {
    name: string;
    description: string;
    tags: string;
    /** Base64-encoded image data, no `data:` prefix. PNG/APNG/GIF only — Lottie stickers aren't backed up. */
    image: string;
}

export const backups = pgTable('backups', {
    // one backup per server, only exists once /backup create has run (row presence == "a backup exists")
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    // when this snapshot was taken/last replaced by /backup create
    createdAt: timestamp('created_at').notNull().defaultNow(),

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
    bans: jsonb('bans').$type<BackupBan[]>().notNull().default([]),
    // custom emojis
    emojis: jsonb('emojis').$type<BackupEmoji[]>().notNull().default([]),
    // custom stickers (PNG/APNG/GIF only, see BackupSticker)
    stickers: jsonb('stickers').$type<BackupSticker[]>().notNull().default([])
});

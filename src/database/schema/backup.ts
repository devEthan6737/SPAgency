import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { APIBan, APIOverwrite, APIRole, ChannelType } from 'seyfert';
import { guilds } from './guild.js';

/** One backed-up channel or category, as stored in `backups.channelsCategory`/`channelsText`/`channelsNoCategory`. */
export interface BackupChannel {
    name: string;
    type: ChannelType;
    rawPosition: number;
    nsfw?: boolean;
    topic?: string | null;
    parent?: string;
    permissionOverwrites: APIOverwrite[];
}

/** One backed-up role, as stored in `backups.roles`. */
export interface BackupRole extends Pick<APIRole, 'name' | 'hoist' | 'permissions' | 'mentionable'> {
    colors: { primaryColor: number; secondaryColor: number | null; tertiaryColor: number | null };
    rawPosition: number;
}

/** One backed-up ban, as stored in `backups.bans`. */
export interface BackupBan extends Pick<APIBan, 'reason'> {
    id: string;
}

/** One backed-up custom emoji, as stored in `backups.emojis`. */
export interface BackupEmoji {
    name: string;
    /** Base64-encoded image data, no `data:` prefix. */
    image: string;
}

/** One backed-up custom sticker, as stored in `backups.stickers`. */
export interface BackupSticker {
    name: string;
    description: string;
    tags: string;
    /** Base64-encoded image data, no `data:` prefix. PNG/APNG/GIF only — Lottie stickers aren't backed up. */
    image: string;
}

/** One row per server, only present once `/backup create` has run — row presence means "a backup exists". */
export const backups = pgTable('backups', {
    /** Guild this backup belongs to — the primary key, since there's only one backup per server. */
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    /** When this snapshot was taken, or last replaced by `/backup create`. */
    createdAt: timestamp('created_at').notNull().defaultNow(),

    /** The guild's name at backup time. */
    name: text('name'),
    /** The guild's icon at backup time. */
    icon: text('icon'),
    /** Backed-up categories. */
    channelsCategory: jsonb('channels_category').$type<BackupChannel[]>().notNull().default([]),
    /** Backed-up text channels. */
    channelsText: jsonb('channels_text').$type<BackupChannel[]>().notNull().default([]),
    /** Backed-up channels that have no category. */
    channelsNoCategory: jsonb('channels_no_category').$type<BackupChannel[]>().notNull().default([]),
    /** Backed-up guild roles. */
    roles: jsonb('roles').$type<BackupRole[]>().notNull().default([]),
    /** Backed-up guild bans. */
    bans: jsonb('bans').$type<BackupBan[]>().notNull().default([]),
    /** Backed-up custom emojis. */
    emojis: jsonb('emojis').$type<BackupEmoji[]>().notNull().default([]),
    /** Backed-up custom stickers (PNG/APNG/GIF only, see {@link BackupSticker}). */
    stickers: jsonb('stickers').$type<BackupSticker[]>().notNull().default([])
});

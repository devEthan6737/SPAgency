import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export enum ServerEventType {
    /** A member joined the guild. */
    MemberJoin = 'memberJoin',
    /** A member left the guild. */
    MemberLeave = 'memberLeave',
    ChannelCreate = 'channelCreate',
    ChannelDelete = 'channelDelete',
    ChannelUpdate = 'channelUpdate',
    RoleCreate = 'roleCreate',
    RoleDelete = 'roleDelete',
    WebhookCreate = 'webhookCreate',
    /** The antiraid system detected a raid. */
    RaidDetected = 'raidDetected'
}

/** One row per server event (memberJoin, channelCreate, ...), never edited. */
export const serverEventLogs = pgTable('server_event_logs', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<ServerEventType>(),
    /** Id of the channel/role/member the event happened to, if any. */
    targetId: text('target_id'),
    /** Extra data specific to the event type. */
    data: jsonb('data').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow()
});

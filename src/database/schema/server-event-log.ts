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
    /** A member was banned, detected via the audit log — not necessarily through this bot. */
    Ban = 'ban',
    /** A member was unbanned, detected via the audit log — not necessarily through this bot. */
    Unban = 'unban',
    /** The antiraid system detected a raid. */
    RaidDetected = 'raidDetected',
    /** The antibots system kicked a bot on join. */
    AntibotsKick = 'antibotsKick',
    /** Antiraid was auto-disabled because the bot no longer meets its prerequisites (permissions/role position). */
    AntiraidDisabled = 'antiraidDisabled',
    /** The log channel got unset after a failed send (channel deleted, access lost...). */
    LogsDisabled = 'logsDisabled',
    /** A known malicious user (per UBFB) joined — `data.action` says what `MaliciousMemberSystem` did about it. */
    MaliciousMemberJoin = 'maliciousMemberJoin',
    /** Raidmode temp-banned someone for joining while it was active. */
    RaidmodeJoinBan = 'raidmodeJoinBan',
    /** Raidmode permanently banned someone for a channel/role/ban/bot-add action while it was active. */
    RaidmodeActionBan = 'raidmodeActionBan',
    /** Raidmode turned itself off automatically once its configured duration elapsed. */
    RaidmodeExpired = 'raidmodeExpired'
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

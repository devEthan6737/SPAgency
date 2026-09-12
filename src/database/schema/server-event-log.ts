import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/** Kind of server event recorded in `server_event_logs` — one variant per event the bot tracks. */
export enum ServerEventType {
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
    RaidmodeExpired = 'raidmodeExpired',
    /** `SelfbotSystem` scored a join as likely a selfbot/fake account — `data.action`/`data.score`/`data.signals` say what it did and why. */
    SelfbotDetected = 'selfbotDetected',
    /** `AutomodSystem` sanctioned a message-time violation (flood, ghostping, caps, emojis, words) — `data.detector`/`data.sanction`/`data.subCount` say which, what it escalated to, and the running automod warn count that triggered it. */
    AutomodViolation = 'automodViolation',
    /** `AntiWebhooksFloodSystem` deleted a webhook for flooding messages — no ban, the creator is never assumed to be the attacker, see docs/moderation.md. */
    WebhookFloodPurge = 'webhookFloodPurge',
    /** `BotAdderSystem` banned whoever added a bot that just got banned as a raider — `data.botId`/`data.source` say which bot and which system caught it. */
    RaidBotAdderBan = 'raidBotAdderBan'
}

/** One row per server event (channelCreate, raidDetected, ...), never edited. */
export const serverEventLogs = pgTable('server_event_logs', {
    /** Row id. */
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    /** Guild the event happened in. */
    guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    /** What kind of event this is. */
    type: text('type').notNull().$type<ServerEventType>(),
    /** Id of the channel/role/member the event happened to, if any. */
    targetId: text('target_id'),
    /** Extra data specific to the event type. */
    data: jsonb('data').$type<Record<string, unknown>>(),
    /** When the event happened. */
    createdAt: timestamp('created_at').notNull().defaultNow()
});

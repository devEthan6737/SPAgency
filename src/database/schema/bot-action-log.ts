import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export enum BotActionType {
    Ban = 'ban',
    Unban = 'unban',
    Forceban = 'forceban',
    Hackban = 'hackban',
    Kick = 'kick',
    Timeout = 'timeout',
    Untimeout = 'untimeout',
    Warn = 'warn',
    Unwarn = 'unwarn',
    Clear = 'clear',
    Lock = 'lock',
    Unlock = 'unlock',
    BackupCreate = 'backupCreate',
    BackupLoad = 'backupLoad',
    MarkMalicious = 'markMalicious',
    UnmarkMalicious = 'unmarkMalicious',
    RaidmodeEnable = 'raidmodeEnable',
    RaidmodeDisable = 'raidmodeDisable',
    /** Auto-sanction taken by the automoderator/antiraid systems, not a manual command. */
    AutomodAction = 'automodAction'
}

/** One row per action requested through the bot (ban, warn, automod...), never edited or deleted. */
export const botActionLogs = pgTable('bot_action_logs', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<BotActionType>(),
    /** Id of the user the action was taken against, if any. */
    targetId: text('target_id'),
    /** Who/what requested the action — a user id, or `'system'` for automated protections. */
    executorId: text('executor_id'),
    reason: text('reason'),
    /** Extra data specific to the action type. */
    data: jsonb('data').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow()
});

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
    Tempban = 'tempban',
    Warn = 'warn',
    Unwarn = 'unwarn',
    Clear = 'clear',
    Lock = 'lock',
    Unlock = 'unlock',
    Nuke = 'nuke',
    BackupCreate = 'backupCreate',
    BackupLoad = 'backupLoad',
    BackupDelete = 'backupDelete',
    ChannelCreate = 'channelCreate',
    ChannelDelete = 'channelDelete',
    CreateInvite = 'createInvite',
    SetIcon = 'setIcon',
    SetName = 'setName',
    AddRole = 'addRole',
    RemoveRole = 'removeRole',
    SetNickname = 'setNickname',
    UnnukeBans = 'unnukeBans',
    UnnukeChannels = 'unnukeChannels',
    UnnukeRoles = 'unnukeRoles',
    UnnukeEmojis = 'unnukeEmojis',
    MarkMalicious = 'markMalicious',
    UnmarkMalicious = 'unmarkMalicious'
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

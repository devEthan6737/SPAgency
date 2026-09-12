import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/**
 * One row per bot currently sitting in a guild, recording who added it — captured live off the
 * `BOT_ADD` audit log entry (see `src/events/guildAuditLogEntryCreate.ts`), never fetched from
 * Discord's own audit log at ban time: that expires (~45 days) and searching it for one bot's entry
 * is slow. Deleted the moment the bot leaves (`src/events/guildMemberRemove.ts`) — once gone there's
 * nothing left to attribute, so this never grows past "bots currently in servers we're in". If a bot
 * was added before we started tracking it (or while the process was down), there's just no row —
 * `BotAdderSystem.enforce` bans the bot alone in that case, see docs/moderation.md.
 */
export const botAdders = pgTable(
    'bot_adders',
    {
        /** Guild the bot was added to. */
        guildId: text('guild_id')
            .notNull()
            .references(() => guilds.id, { onDelete: 'cascade' }),
        /** The added bot's user id. */
        botId: text('bot_id').notNull(),
        /** Id of the member who added the bot. */
        executorId: text('executor_id').notNull(),
        /** When the bot was added. */
        addedAt: timestamp('added_at').notNull().defaultNow()
    },
    (table) => [ primaryKey({ columns: [table.guildId, table.botId] }) ]
);

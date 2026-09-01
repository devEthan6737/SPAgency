import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const guildModeration = pgTable('guild_moderation', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    // preset reasons staff can pick from for mod actions (forcereason.js)
    forceReasons: text('force_reasons').array().notNull().default([]),

    // basic message-rate flood protection (antiflood.js) — moved here from guild_protection: this
    // polices in-server chat conduct, not a join-time/structural attack, so it belongs with
    // moderation, not protection (see docs/moderation.md). No native Discord AutoMod trigger covers
    // message frequency, so this stays bot-side even once AutoMod handles keywords/mention-spam.
    antiflood: boolean('antiflood').notNull().default(true),

    // deletes webhooks that flood messages, banning the owner on repeat offense (was
    // purge-webhooks-attacks.js) — renamed from purgeWebhooksAttacks* for consistency with antiflood,
    // now that both live together as moderation's two flood responses
    antiWebhooksFlood: boolean('anti_webhooks_flood').notNull().default(false),
    antiWebhooksFloodRememberOwner: text('anti_webhooks_flood_remember_owner').notNull().default('Nadie')
});

import { pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export const guildModeration = pgTable('guild_moderation', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    // preset reasons staff can pick from for mod actions (forcereason.js)
    forceReasons: text('force_reasons').array().notNull().default([])
});

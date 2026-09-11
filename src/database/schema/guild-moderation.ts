import { boolean, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

/**
 * What happens once a member's automod violation count (see docs/moderation.md) reaches
 * `automodFinalActionAt`. Mute doesn't need a variant here — it always happens first, at the lower
 * `automodMuteAt` threshold, regardless of this setting.
 */
export enum AutomodFinalAction {
    /** No escalation beyond the mute — automod keeps muting on repeat offenses forever. */
    None = 'none',
    Kick = 'kick',
    Ban = 'ban'
}

/**
 * Any `UPDATE` on this table fires `guild_moderation_notify_config_changed` — a Postgres trigger (see
 * `drizzle/0025_guild_moderation_notify_config_changed.sql`, not represented here since Drizzle's
 * schema builder has no declarative way to express triggers) that does `pg_notify('guild_config_changed',
 * guild_id)`. Added later than `guild_protection`/`guild_configuration`'s own triggers — this table's
 * columns only started feeding `GuildConfigCache` once `AutomodSystem` needed them; before that,
 * nothing read `guild_moderation` on a hot path, so staleness here didn't matter.
 */
export const guildModeration = pgTable('guild_moderation', {
    guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),
    // preset reasons staff can pick from for mod actions (forcereason.js)
    forceReasons: text('force_reasons').array().notNull().default([]),

    // basic message-rate flood protection (antiflood.js) — moved here from guild_protection: this
    // polices in-server chat conduct, not a join-time/structural attack, so it belongs with
    // moderation, not protection (see docs/moderation.md). No native Discord AutoMod trigger covers
    // message frequency, so this stays bot-side even once AutoMod handles keywords/mention-spam.
    antiflood: boolean('antiflood').notNull().default(true),

    // deletes webhooks that flood messages (was purge-webhooks-attacks.js) — renamed from
    // purgeWebhooksAttacks* for consistency with antiflood, now that both live together as
    // moderation's two flood responses. No "remember the creator" column: see docs/moderation.md for
    // why banning a webhook's creator on repeat offense punishes the wrong person more often than not.
    antiWebhooksFlood: boolean('anti_webhooks_flood').notNull().default(false),

    // deletes the message and warns when someone @mentions and deletes it shortly after
    ghostpingEnable: boolean('ghostping_enable').notNull().default(false),

    // deletes and warns when a message is mostly uppercase — only checked past a minimum length
    // (fixed in code, see AutomodSystem) so short reactions like "OK" never trip it
    capsLockEnable: boolean('caps_lock_enable').notNull().default(false),
    // percent of letters that must be uppercase to count, e.g. 70
    capsLockThreshold: integer('caps_lock_threshold').notNull().default(70),

    manyEmojisEnable: boolean('many_emojis_enable').notNull().default(false),
    // emoji count (custom + unicode) a single message can have before it counts as spam
    manyEmojisThreshold: integer('many_emojis_threshold').notNull().default(8),

    manyWordsEnable: boolean('many_words_enable').notNull().default(false),
    // word count a single message can have before it counts as a wall-of-text
    manyWordsThreshold: integer('many_words_threshold').notNull().default(150),

    // shared escalation ladder every automod detector above (plus antiflood) feeds into — see
    // docs/moderation.md. Each violation adds one `warns` row with moderatorId 'SP Agency'; the ladder acts
    // on that count, not on any one detector individually.
    automodMuteAt: integer('automod_mute_at').notNull().default(3),
    automodMuteMinutes: integer('automod_mute_minutes').notNull().default(10),
    automodFinalAction: text('automod_final_action').notNull().$type<AutomodFinalAction>().default(AutomodFinalAction.None),
    automodFinalActionAt: integer('automod_final_action_at').notNull().default(6)
});

import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export enum AntibotsType {
    /** Kicks every bot that joins. */
    All = 'all',
    /** Kicks only bots Discord hasn't reviewed — the real threat, since a Discord-verified bot is
     * the least suspicious kind. A "kick only verified bots" mode existed in the legacy bot but
     * made no security sense, so it wasn't carried over. */
    OnlyUnverified = 'onlyUnverified'
}

/**
 * What happens on join for a known malicious user (per UBFB). The join itself is always logged,
 * for every case including `None` — that part never depended on this setting. DMing the server
 * owner, on the other hand, isn't a separate toggle: it happens automatically whenever the action
 * is `Mark` or `Ban` (there'd be no reason to pick either of those and *not* want to know about it),
 * and doesn't happen for `None`.
 */
export enum MaliciousMemberAction {
    /** Nothing beyond the unconditional log — the member joins like anyone else, no DM to the owner either. */
    None = 'none',
    /**
     * Lets them in, but DMs the server owner and changes their nickname to the reason they're
     * marked malicious — the nickname change is silently skipped if the bot lacks Manage Nicknames
     * or the member outranks it (the log/DM still happen either way). The legacy bot had 4 variants
     * here (rename, add a role, log to the log channel, DM the owner); the other 3 were dead weight
     * — the DM and the log now always happen regardless of this setting, and "add a role" was never
     * actually used.
     */
    Mark = 'mark',
    /**
     * DMs the server owner and bans them immediately — not a kick, on purpose. A kick lets them try
     * rejoining right away; letting that repeat indefinitely risks a race in the join-handling path
     * that could eventually let them slip in undetected. A ban removes that risk entirely, so
     * there's no escalation ladder to get right — just one action that reliably works the first time.
     */
    Ban = 'ban'
}

/**
 * Any `UPDATE` on this table fires `guild_protection_notify_config_changed` — a Postgres trigger
 * (see `drizzle/0005_thin_madame_hydra.sql`, not represented here since Drizzle's schema builder has
 * no declarative way to express triggers) that does `pg_notify('guild_config_changed', guild_id)`.
 * `GuildConfigCache` and `RaidmodeExpiry` both `LISTEN` on that channel to invalidate/reschedule
 * without polling — see docs/antiraid.md section 2.
 */
export const guildProtection = pgTable('guild_protection',
    {
        guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

        // main raid detector: bans on suspicious bursts of channel/role/ban/member events (antiraid.js)
        antiraidEnable: boolean('antiraid_enable').notNull().default(true),

        // kicks bots on join (antibots.js)
        antibotsEnable: boolean('antibots_enable').notNull().default(false),
        antibotsType: text('antibots_type').notNull().$type<AntibotsType>().default(AntibotsType.All),

        // expels "zombie" users (selfbots/fake accounts) on join (antitokens.js)
        antitokensEnable: boolean('antitokens_enable').notNull().default(false),

        // what to do when a known malicious user (per UBFB) joins — mark.js and kick-malicious.js
        // used to be two independent booleans that could both be on at once, which makes no sense
        // (let them in and flag them, vs. remove them, are mutually exclusive outcomes)
        maliciousMemberAction: text('malicious_member_action').notNull().$type<MaliciousMemberAction>().default(MaliciousMemberAction.Mark),

        // anti-selfbot verification flow (verification.js, variantes --v1..--v4)
        verificationEnable: boolean('verification_enable').notNull().default(false),
        verificationType: text('verification_type'),
        verificationChannel: text('verification_channel'),
        verificationRole: text('verification_role'),

        // removes malicious webhooks (purge-webhooks-attacks.js)
        purgeWebhooksAttacksEnable: boolean('purge_webhooks_attacks_enable').notNull().default(false),
        purgeWebhooksAttacksRememberOwner: text('purge_webhooks_attacks_remember_owner').notNull().default('Nadie'),

        // pings SP Agency staff when the bot detects a raid it can't handle alone (intelligentsos.js)
        intelligentSosEnable: boolean('intelligent_sos_enable').notNull().default(false),
        intelligentSosCooldown: boolean('intelligent_sos_cooldown').notNull().default(false),

        // smarter flood detection, checked in eventos/messageCreate.js
        intelligentAntiflood: boolean('intelligent_antiflood').notNull().default(false),
        // basic flood protection toggle
        antiflood: boolean('antiflood').notNull().default(true),

        // blocks accounts younger than this on join, e.g. '1h' (bloq-new-created-users.js)
        bloqNewCreatedUsersTime: text('bloq_new_created_users_time').notNull().default('1h'),

        // manual lockdown (raidmode.js) — see docs/raidmode.md. Disabling it goes through the
        // existing 2FA (guild_configuration.password*) instead of a password of its own.
        raidmodeEnable: boolean('raidmode_enable').notNull().default(false),
        // duration new joins get temp-banned for while active, e.g. '1d' — also how long raidmode
        // itself stays on before RaidmodeExpiry turns it off automatically
        raidmodeTimeToDisable: text('raidmode_time_to_disable').notNull().default('1d'),
        // when raidmode was turned on — null while off. A real timestamp, not epoch ms in an
        // `integer` column: a 4-byte int overflows a millisecond `Date.now()` (13 digits) by three
        // orders of magnitude, which the legacy schema did without anyone noticing since Mongo
        // doesn't enforce column widths.
        raidmodeActivatedAt: timestamp('raidmode_activated_at')
    },
    (table) => [index('guild_protection_antiraid_enable_idx').on(table.antiraidEnable)]
);

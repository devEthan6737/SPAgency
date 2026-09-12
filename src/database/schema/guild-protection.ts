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
 * What SPA does with a member `SelfbotSystem` scores as likely a selfbot/fake account (account age,
 * default avatar, suspicious name, simultaneous joins — see docs/selfbot.md). A heuristic, not a
 * confirmed hit like `MaliciousMemberAction` — false positives are more likely, so `Kick` (reversible)
 * is the sane default action, with `Ban` available for servers that want maximum aggressiveness.
 */
export enum SelfbotAction {
    /** Nothing beyond the unconditional log. */
    None = 'none',
    Kick = 'kick',
    Ban = 'ban'
}

/**
 * Any `UPDATE` on this table fires `guild_protection_notify_config_changed` — a Postgres trigger
 * (see `drizzle/0000_baseline.sql`, not represented here since Drizzle's schema builder has no
 * declarative way to express triggers) that does `pg_notify('guild_config_changed', guild_id)`.
 * `GuildConfigCache` and `RaidmodeExpiry` both `LISTEN` on that channel to invalidate/reschedule
 * without polling — see docs/antiraid.md section 2.
 */
export const guildProtection = pgTable('guild_protection',
    {
        /** Guild this protection configuration belongs to. */
        guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

        /** Main raid detector: bans on suspicious bursts of channel/role/ban/member events (`antiraid.js`). */
        antiraidEnable: boolean('antiraid_enable').notNull().default(true),

        /** Kicks bots on join (`antibots.js`). */
        antibotsEnable: boolean('antibots_enable').notNull().default(false),
        /** Which bots {@link antibotsEnable} kicks. */
        antibotsType: text('antibots_type').notNull().$type<AntibotsType>().default(AntibotsType.All),

        /**
         * What to do with a member `SelfbotSystem` scores as likely a selfbot/fake account on join —
         * replaces the old `antitokens.js` (a broken username/join-count heuristic, see docs/selfbot.md).
         */
        selfbotAction: text('selfbot_action').notNull().$type<SelfbotAction>().default(SelfbotAction.None),
        /**
         * Only the account-age signal is per-guild tunable — the rest of `SelfbotSystem`'s weights are
         * fixed in code, see docs/selfbot.md. Defaults to `'30d'` since the duration parser has no
         * month unit (only s/m/h/d/w).
         */
        selfbotMinAccountAge: text('selfbot_min_account_age').notNull().default('30d'),

        /**
         * What to do when a known malicious user (per UBFB) joins. Replaces the legacy bot's two
         * independent booleans (`mark.js`/`kick-malicious.js`), which made no sense as separate
         * toggles since "let them in and flag them" and "remove them" are mutually exclusive.
         */
        maliciousMemberAction: text('malicious_member_action').notNull().$type<MaliciousMemberAction>().default(MaliciousMemberAction.Mark),

        /**
         * Web-only verification (OAuth2 + captcha on SPA's own dashboard) — see docs/verification.md.
         * No channel/type column: the legacy bot's in-Discord variants were all automatable by a
         * selfbot; a real Discord OAuth2 login isn't.
         */
        verificationEnable: boolean('verification_enable').notNull().default(false),
        /** Role granted once a member passes verification. */
        verificationRole: text('verification_role'),

        /**
         * Pings SP Agency staff when `AntiraidSystem` bans someone for a detected raid — see
         * docs/intelligent-sos.md. The alert cooldown lives in memory (`IntelligentSosSystem`), not here.
         */
        intelligentSosEnable: boolean('intelligent_sos_enable').notNull().default(false),

        /**
         * Manual lockdown (`raidmode.js`) — see docs/raidmode.md. A plain dashboard toggle, no
         * password of its own (the legacy bot's per-server raidmode password/2FA was never ported).
         */
        raidmodeEnable: boolean('raidmode_enable').notNull().default(false),
        /**
         * Duration new joins get temp-banned for while raidmode is active, e.g. `'1d'` — also how
         * long raidmode itself stays on before `RaidmodeExpiry` turns it off automatically.
         */
        raidmodeTimeToDisable: text('raidmode_time_to_disable').notNull().default('1d'),
        /**
         * When raidmode was turned on, `null` while off. A real timestamp rather than epoch ms in an
         * `integer` column, since a 4-byte int can't hold a millisecond `Date.now()`.
         */
        raidmodeActivatedAt: timestamp('raidmode_activated_at')
    },
    (table) => [index('guild_protection_antiraid_enable_idx').on(table.antiraidEnable)]
);

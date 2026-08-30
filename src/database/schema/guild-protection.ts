import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { guilds } from './guild.js';

export enum AntibotsType {
    /** Kicks every bot that joins. */
    All = 'all',
    /** Kicks only bots Discord hasn't reviewed — the real threat, since a Discord-verified bot is
     * the least suspicious kind. A "kick only verified bots" mode existed in the legacy bot but
     * made no security sense, so it wasn't carried over. */
    OnlyUnverified = 'onlyUnverified'
}

export const guildProtection = pgTable(
    'guild_protection',
    {
        guildId: text('guild_id').primaryKey().references(() => guilds.id, { onDelete: 'cascade' }),

        // main raid detector: bans on suspicious bursts of channel/role/ban/member events (antiraid.js)
        antiraidEnable: boolean('antiraid_enable').notNull().default(true),

        // kicks bots on join (antibots.js)
        antibotsEnable: boolean('antibots_enable').notNull().default(false),
        antibotsType: text('antibots_type').notNull().$type<AntibotsType>().default(AntibotsType.All),

        // expels "zombie" users (selfbots/fake accounts) on join (antitokens.js)
        antitokensEnable: boolean('antitokens_enable').notNull().default(false),

        // kicks/bans every detected join while active (antijoins.js)
        antijoinsEnable: boolean('antijoins_enable').notNull().default(false),

        // renames or adds a role to malicious users on join (markmalicious.js)
        markMaliciousEnable: boolean('mark_malicious_enable').notNull().default(true),
        markMaliciousType: text('mark_malicious_type').notNull().default('changeNickname'),

        // DMs the server owner when a known malicious user joins (warn-entry.js)
        warnEntry: boolean('warn_entry').notNull().default(true),
        // kicks a known malicious user on join, bans if they keep rejoining (kick-malicious.js)
        kickMaliciousEnable: boolean('kick_malicious_enable').notNull().default(false),

        // anti-selfbot verification flow (verification.js, variantes --v1..--v4)
        verificationEnable: boolean('verification_enable').notNull().default(false),
        verificationType: text('verification_type'),
        verificationChannel: text('verification_channel'),
        verificationRole: text('verification_role'),

        // kicks a user who left the server and tries to rejoin (cannot-enter-twice.js)
        cannotEnterTwiceEnable: boolean('cannot_enter_twice_enable').notNull().default(false),
        cannotEnterTwiceUsers: text('cannot_enter_twice_users').array().notNull().default([]),

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

        // kicks users whose username matches a blacklist (bloq-entrities-by-name.js)
        bloqEntritiesByNameEnable: boolean('bloq_entrities_by_name_enable').notNull().default(false),
        bloqEntritiesByNameNames: text('bloq_entrities_by_name_names').array().notNull().default(['raider', 'doxer', 'hacker', 'infecter']),

        // blocks accounts younger than this on join, e.g. '1h' (bloq-new-created-users.js)
        bloqNewCreatedUsersTime: text('bloq_new_created_users_time').notNull().default('1h'),

        // manual lockdown: bans joins until it expires (raidmode.js)
        raidmodeEnable: boolean('raidmode_enable').notNull().default(false),
        raidmodeTimeToDisable: text('raidmode_time_to_disable').notNull().default('1d'),
        raidmodePassword: text('raidmode_password').notNull().default('Nothing'),
        raidmodeActivedDate: integer('raidmode_actived_date').notNull().default(0)
    },
    // queried unconditionally and recurrently by AntiraidSystem.recheckAllPrerequisites on every `ready`
    (table) => [index('guild_protection_antiraid_enable_idx').on(table.antiraidEnable)]
);

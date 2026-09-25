/**
 * English locale — the fallback/base language Seyfert registers commands under (see
 * `@Declare({ name, description })` in CONTRIBUTING.md's "Idioma" section).
 *
 * Structure mirrors the command tree 1:1: `commands.<categoria>.<comando>.<clave>`, plus a top-level
 * `systems` namespace for messages with no direct command invoker (protection systems, logs,
 * automod). Dynamic strings are functions `(args) => string`; fixed strings are plain literals. Text
 * shared between sibling commands lives under a `shared` key in that category instead of being
 * duplicated per command.
 */
import { EmojiKey, Emojis } from '../systems/emojis/index.js';
import type { InfoStatsText } from '../systems/info/index.js';

/** Shorthand for the emoji a message shows for a key, resolved when this file is imported. */
const emoji = (key: EmojiKey): string => Emojis.get(key);

export default {
    commands: {
        configuration: {
            ping: {
                name: 'ping',
                description: 'Shows the bot latency.',
                calculating: `${emoji(EmojiKey.LoadingGray)} Calculating...`,
                latency: (message: number, api: number) =>
                    `${emoji(EmojiKey.MessageLatency)} Message latency: \`${message}ms\`\n${emoji(EmojiKey.ApiLatency)} API latency: \`${api}ms\``,
                withDatabase: (message: number, api: number, database: number) =>
                    `${emoji(EmojiKey.MessageLatency)} Message latency: \`${message}ms\`\n${emoji(EmojiKey.ApiLatency)} API latency: \`${api}ms\`\n${emoji(EmojiKey.DatabaseLatency)} Database latency: \`${database}ms\``
            },
            channel: {
                name: 'channel',
                description: 'Manage your server channels.',
                usage: 'Use `/channel create` or `/channel delete`.',
                created: `${emoji(EmojiKey.Success)} Channel created.`,
                deleted: `${emoji(EmojiKey.Success)} Channel deleted.`,
                create: {
                    name: 'create',
                    description: 'Creates a new text channel.',
                    option: { name: { name: 'name', description: 'Name for the new channel.' } }
                },
                delete: {
                    name: 'delete',
                    description: 'Deletes a channel.',
                    option: { channel: { name: 'channel', description: 'Channel to delete.' } }
                }
            },
            guild: {
                name: 'guild',
                description: 'Manage your server.',
                usage: 'Use `/guild set-name`, `/guild set-icon`, `/guild create-invite`, or `/guild info`.',
                setName: {
                    name: 'set-name',
                    description: "Changes the server's name.",
                    option: { name: { name: 'name', description: 'New server name.' } },
                    done: `${emoji(EmojiKey.Success)} Server name updated.`
                },
                setIcon: {
                    name: 'set-icon',
                    description: "Changes the server's icon.",
                    option: { url: { name: 'url', description: 'Link to the new icon image.' } },
                    done: `${emoji(EmojiKey.Success)} Server icon updated.`,
                    invalidUrl: "❌ Couldn't download that image."
                },
                createInvite: {
                    name: 'create-invite',
                    description: 'Creates an invite for a random text channel.',
                    done: (invite: string) => `${emoji(EmojiKey.Success)} Invite created: ${invite}`,
                    noChannel: `${emoji(EmojiKey.Error)} No text channel is available.`
                },
                info: {
                    name: 'info',
                    description: 'Shows information about the server.',
                    id: 'ID',
                    owner: 'Owner',
                    createdAt: 'Created at',
                    verificationLevel: 'Verification level',
                    boosts: 'Boosts'
                }
            },
            member: {
                name: 'member',
                description: 'Manage your server members.',
                usage: 'Use `/member set-nickname`, `/member add-role`, `/member remove-role`, or `/member info`.',
                setNickname: {
                    name: 'set-nickname',
                    description: "Changes a member's nickname.",
                    option: {
                        member: { name: 'member', description: 'Member to edit.' },
                        nickname: { name: 'nickname', description: 'New nickname.' }
                    },
                    done: `${emoji(EmojiKey.Success)} Nickname updated.`
                },
                addRole: {
                    name: 'add-role',
                    description: 'Adds a role to a member.',
                    done: `${emoji(EmojiKey.Success)} Role added.`
                },
                removeRole: {
                    name: 'remove-role',
                    description: 'Removes a role from a member.',
                    done: `${emoji(EmojiKey.Success)} Role removed.`
                },
                role: {
                    option: {
                        member: { name: 'member', description: 'Member to edit.' },
                        role: { name: 'role', description: 'Role to add/remove.' }
                    },
                    hierarchyError: "❌ You can't manage a role equal to or higher than your own."
                },
                info: {
                    name: 'info',
                    description: 'Shows information about a member.',
                    option: { member: { name: 'member', description: 'Member to look up.' } },
                    id: 'ID',
                    nickname: 'Nickname',
                    noNickname: 'No nickname',
                    joinedAt: 'Joined at',
                    roles: 'Roles',
                    noRoles: 'No roles'
                }
            },
            unnuke: {
                name: 'unnuke',
                description: 'Automated cleanup after a raid: duplicate channels/roles/emojis, or a mass-ban.',
                usage: 'Use `/unnuke channels`, `/unnuke roles`, `/unnuke emojis`, or `/unnuke bans`.',
                started: `${emoji(EmojiKey.LoadingGreen)} Cleaning up, this might take a moment...`,
                done: (removed: number) => `${emoji(EmojiKey.Success)} Done. Removed \`${removed}\` entries.`,
                nothing: 'ℹ️ There is nothing to delete.',
                confirmLabel: 'Yes, continue',
                cancelLabel: 'Cancel',
                channels: {
                    name: 'channels',
                    description: 'Deletes channels with a duplicate name.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} \`${count}\` channels share a name with an earlier one and will be deleted: ${list}.\nIf any were duplicated on purpose, they will be deleted too, and this can't be undone. Sure?`
                },
                roles: {
                    name: 'roles',
                    description: 'Deletes roles with a duplicate name.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} \`${count}\` roles share a name with an earlier one and will be deleted: ${list}.\nIf any were duplicated on purpose, they will be deleted too, and this can't be undone. Sure?`
                },
                emojis: {
                    name: 'emojis',
                    description: 'Deletes emojis with a duplicate name.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} \`${count}\` emojis share a name with an earlier one and will be deleted: ${list}.\nIf any were duplicated on purpose, they will be deleted too, and this can't be undone. Sure?`
                },
                bans: {
                    name: 'bans',
                    description: 'Unbans every currently banned user.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} \`${count}\` users will be unbanned: ${list}.\nEvery ban is lifted, not only those of a raid. Sure?`
                }
            }
        },
        moderation: {
            lock: {
                name: 'lock',
                description: 'Locks the channel so only staff can send messages.',
                option: { role: { name: 'role', description: 'Role to lock. Defaults to @everyone.' } },
                done: '🔒 Channel locked.'
            },
            unlock: {
                name: 'unlock',
                description: 'Unlocks the channel, letting the role send messages again.',
                option: { role: { name: 'role', description: 'Role to unlock. Defaults to @everyone.' } },
                done: '🔓 Channel unlocked.'
            },
            clear: {
                name: 'clear',
                description: 'Bulk-deletes messages from this channel.',
                option: { amount: { name: 'amount', description: 'How many messages to delete (1-1000).' } },
                done: (amount: number) => `${emoji(EmojiKey.Success)} Deleted \`${amount}\` messages.`
            },
            nuke: {
                name: 'nuke',
                description: 'Deletes and recreates this channel, wiping all its messages.',
                notText: `${emoji(EmojiKey.Error)} This can only be used in text channels.`,
                confirm: "⚠️ This will delete **all** messages in this channel and can't be undone. Are you sure?",
                confirmLabel: 'Yes, wipe it',
                cancelLabel: 'Cancel',
                done: `${emoji(EmojiKey.Success)} Channel reset.`
            },
            shared: {
                cannotTargetBot: "❌ I can't do that to myself.",
                cannotTargetSelf: "❌ You can't do that to yourself.",
                hierarchyError: "❌ You can't moderate someone with a role equal to or higher than your own.",
                defaultReason: 'No reason specified.',
                dm: (guildName: string, reason: string) => `You received a moderation action in \`${guildName}\`.\n**Reason:** ${reason}`,
                forceReasonRequired: (allowed: string[]) =>
                    `${emoji(EmojiKey.Error)} This server requires one of its predefined reasons: ${allowed.map((reason) => `\`${reason}\``).join(', ')}.`
            },
            ban: {
                name: 'ban',
                description: 'Bans a member from your server.',
                option: {
                    member: { name: 'member', description: 'Member to ban.' },
                    reason: { name: 'reason', description: 'Ban reason.' }
                },
                done: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} <@${userId}> has been banned.\n**Reason:** ${reason}`
            },
            kick: {
                name: 'kick',
                description: 'Kicks a member from your server.',
                option: {
                    member: { name: 'member', description: 'Member to kick.' },
                    reason: { name: 'reason', description: 'Kick reason.' }
                },
                notAMember: "❌ That user isn't a member of this server.",
                done: (userId: string, reason: string) => `👢 <@${userId}> has been kicked.\n**Reason:** ${reason}`
            },
            hackban: {
                name: 'hackban',
                description: "Bans a user who isn't a member of your server, by id.",
                option: {
                    id: { name: 'id', description: "ID of the user to ban — doesn't need to be a member of this server." },
                    reason: { name: 'reason', description: 'Ban reason.' }
                },
                invalidId: "❌ That isn't a valid id.",
                failed: "❌ I couldn't ban that user.",
                done: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` has been banned.\n**Reason:** ${reason}`
            },
            timeout: {
                name: 'timeout',
                description: "Discord's native timeout — mutes a member for a set duration.",
                option: {
                    member: { name: 'member', description: 'Member to time out.' },
                    minutes: { name: 'minutes', description: "Duration in minutes (10-40320, Discord's 28-day cap)." },
                    reason: { name: 'reason', description: 'Timeout reason.' }
                },
                notAMember: "❌ That user isn't a member of this server.",
                failed: "❌ I couldn't time out that user.",
                done: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> has been timed out for \`${minutes}\` minutes.\n**Reason:** ${reason}`
            },
            detect: {
                name: 'detect',
                description: 'Scans your server members against the UBFB blacklist.',
                scanning: `${emoji(EmojiKey.LoadingSpinner)} Scanning members, this might take a moment...`,
                noneFound: `${emoji(EmojiKey.Success)} No malicious users found.`,
                found: (count: number, guildName: string) => `🚫 Found \`${count}\` malicious users in \`${guildName}\`:`,
                entry: (userId: string, reason: string) => `<@${userId}> — Reason: \`${reason}\``,
                entryUnknownReason: (userId: string) => `<@${userId}> — Unknown reason`
            },
            forceban: {
                name: 'forceban',
                description: 'Bans every UBFB blacklist entry from your server, member or not.',
                option: { reason: { name: 'reason', description: 'Only ban blacklist entries with this reason. Defaults to everyone.' } },
                noneMatching: `${emoji(EmojiKey.Error)} No blacklist entries match.`,
                confirm: (count: number) => `${emoji(EmojiKey.Warning)} This will ban \`${count}\` users from the UBFB blacklist. Are you sure?`,
                confirmLabel: 'Yes, ban them all',
                cancelLabel: 'Cancel',
                done: (banned: number, total: number) => `${emoji(EmojiKey.Success)} Banned \`${banned}\`/\`${total}\` users.`
            },
            sos: {
                name: 'sos',
                description: 'Pings SPAgency staff with a fresh invite to this server. For emergencies.',
                noStaffChannel: "❌ The staff alert channel isn't configured — contact SPAgency support directly.",
                noChannel: `${emoji(EmojiKey.Error)} No text channel is available to create the invite.`,
                done: `${emoji(EmojiKey.Success)} Alert sent.`
            },
            baninfo: {
                name: 'baninfo',
                description: "Shows a server ban's details.",
                option: { user: { name: 'user', description: 'User to check.' } },
                notBanned: "❌ That user isn't banned.",
                noReason: 'No reason specified',
                info: (username: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${username}\` is banned.\n**Reason:** ${reason}`
            },
            unban: {
                name: 'unban',
                description: 'Unbans a user from your server.',
                option: { id: { name: 'id', description: 'ID of the user to unban.' } },
                invalidId: "❌ That isn't a valid id.",
                notBanned: "❌ That user isn't banned.",
                done: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` has been unbanned.`
            },
            untimeout: {
                name: 'untimeout',
                description: "Removes a member's timeout.",
                option: { member: { name: 'member', description: 'Member to remove the timeout from.' } },
                notAMember: "❌ That user isn't a member of this server.",
                failed: "❌ I couldn't remove that user's timeout.",
                done: (userId: string) => `${emoji(EmojiKey.Success)} Removed the timeout from <@${userId}>.`
            },
            tempban: {
                name: 'tempban',
                description: 'Bans a member for a set duration, then unbans them automatically.',
                option: {
                    member: { name: 'member', description: 'Member to temp-ban.' },
                    minutes: { name: 'minutes', description: 'Ban duration in minutes (minimum 2).' },
                    reason: { name: 'reason', description: 'Ban reason.' }
                },
                autoUnbanReason: 'Temp-ban expired.',
                done: (userId: string, minutes: number, reason: string) =>
                    `${emoji(EmojiKey.Ban)} <@${userId}> banned for \`${minutes}\` minutes.\n**Reason:** ${reason}`
            },
            warn: {
                name: 'warn',
                description: 'Adds a warning to a member.',
                option: {
                    member: { name: 'member', description: 'Member to warn.' },
                    reason: { name: 'reason', description: 'Warn reason.' }
                },
                done: (userId: string, total: number, reason: string) =>
                    `${emoji(EmojiKey.Warning)} <@${userId}> warned (\`${total}\` total).\n**Reason:** ${reason}`
            },
            warns: {
                name: 'warns',
                description: "Lists a member's warnings.",
                option: { member: { name: 'member', description: 'Member to check warnings for.' } },
                none: "✅ That user has no warnings.",
                intro: (userId: string, total: number) => `<@${userId}> has \`${total}\` warning(s):`,
                entry: (id: number, reason: string, moderatorId: string) => `\`#${id}\` — ${reason} (by <@${moderatorId}>)`
            },
            unwarn: {
                name: 'unwarn',
                description: "Removes one (or all) of a member's warnings.",
                option: {
                    member: { name: 'member', description: 'Member to remove a warning from.' },
                    id: { name: 'id', description: 'ID of the specific warning to remove (see /warns).' },
                    all: { name: 'all', description: "Remove all of this member's warnings instead of one." }
                },
                needsIdOrAll: `${emoji(EmojiKey.Error)} Specify \`id\` or set \`all\` to true.`,
                notFound: "❌ There's no warning with that id for that user.",
                done: (userId: string, id: number) => `${emoji(EmojiKey.Success)} Removed warning \`#${id}\` from <@${userId}>.`,
                doneAll: (userId: string, total: number) => `${emoji(EmojiKey.Success)} Removed \`${total}\` warnings from <@${userId}>.`
            },
            backup: {
                name: 'backup',
                description: 'Snapshot and restore this server (channels, roles, bans, emojis, stickers).',
                usage: 'Use `/backup create`, `/backup info`, `/backup load`, or `/backup delete`.',
                none: "❌ This server doesn't have a saved backup.",
                deleted: `${emoji(EmojiKey.Success)} Backup deleted.`,
                overwritePrompt: `${emoji(EmojiKey.Warning)} This will replace the existing backup — the old one will be lost. Are you sure?`,
                overwriteYes: 'Yes, overwrite it',
                overwriteNo: 'Cancel',
                deletePrompt: "⚠️ This will permanently delete this server's backup. Are you sure?",
                deleteYes: 'Yes, delete it',
                deleteNo: 'Cancel',
                creating: '⏳ Creating backup, this might take a moment...',
                created: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Success)} Backup created: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                details: (name: string, channels: number, roles: number, bans: number, emojis: number, stickers: number, createdAt: Date) =>
                    `${emoji(EmojiKey.Backup)} Backup of \`${name}\`, taken <t:${Math.floor(createdAt.getTime() / 1000)}:R>.\n\`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                cleanupPrompt: `${emoji(EmojiKey.Warning)} Clean up duplicate-named channels/roles (from a raid) before restoring?`,
                cleanupYes: 'Yes, clean up first',
                cleanupNo: 'No, just restore',
                restoring: '⏳ Restoring, this might take a moment...',
                restored: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Success)} Restored \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, and \`${stickers}\` stickers that were missing.`,
                create: {
                    name: 'create',
                    description: 'Snapshots this server (channels, roles, bans, emojis, stickers) so it can be restored later.'
                },
                info: { name: 'info', description: "Shows this server's saved backup, if any." },
                load: {
                    name: 'load',
                    description: 'Restores whatever is missing (channels, roles, bans, emojis, stickers) from the saved backup.'
                },
                delete: { name: 'delete', description: "Deletes this server's saved backup." }
            }
        },
        others: {
            commands: {
                name: 'commands',
                description: "Get all the bot's commands.",
                intro: `${emoji(EmojiKey.Book)} Here are all my commands.`,
                categories: {
                    configuration: 'Configuration',
                    moderation: 'Moderation',
                    others: 'Others'
                },
                hint: 'Use `/commands <command>` to see the detail of one.',
                option: {
                    name: 'command',
                    description: 'Name of the command to look up.'
                },
                notFound: (name: string) => `${emoji(EmojiKey.Error)} There's no command called \`${name}\`.`,
                usage: {
                    options: 'Options',
                    required: 'required',
                    noOptions: 'This command has no options.',
                    subcommands: 'Subcommands',
                    aliases: 'Aliases'
                }
            },
            canary: {
                name: 'canary',
                description: 'Explains what the canary bot is and how to help test it.',
                title: 'What is the canary?',
                intro: '**SPAgency Canary** is the testing version of the bot: a Discord application separate from the production one, which people install on purpose to try changes before everyone else. If you are reading this, you are one of them.',
                expect: {
                    title: 'What to expect',
                    list: `${emoji(EmojiKey.Warning)} **::** It may fail, behave differently or restart without notice. It is for testing, not for protecting an important server.\n${emoji(EmojiKey.LoadingBlue)} **::** New things reach it before they reach production.`
                },
                differs: {
                    title: 'How it differs from production',
                    list: `${emoji(EmojiKey.Arrow)} **::** It is not connected to the web: no support tickets, verification links or API.\n${emoji(EmojiKey.Arrow)} **::** The dashboard's configuration does reach it, just as it reaches production.`
                },
                help: {
                    title: 'How to help',
                    text: `${emoji(EmojiKey.Book)} **::** Try the features, try to break them and tell us what happens: in the support server or on GitHub.`
                }
            },
            info: {
                name: 'info',
                description: 'Shows information about the bot.',
                links: {
                    inviteBot: 'Invite the bot',
                    support: 'Support server',
                    donate: 'Donate',
                    github: 'GitHub',
                    web: 'Website'
                },
                pages: {
                    general: 'General',
                    technical: 'Technical'
                },
                about: (badge: string) => `${badge}**SPAgency**, a moderation and protection bot for your server.\n${emoji(EmojiKey.Arrow)} Use \`/commands\` to see everything I can do.`,
                stack: {
                    title: 'Built with',
                    list: `${emoji(EmojiKey.TypeScript)} **::** \`TypeScript\`\n${emoji(EmojiKey.JavaScript)} **::** \`Node.js\`\n${emoji(EmojiKey.Seyfert)} **::** \`Seyfert\`\n${emoji(EmojiKey.PostgreSql)} **::** \`PostgreSQL\``
                },
                stats: {
                    title: 'By the numbers',
                    uptimeWords: { day: 'day', days: 'days', hour: 'hour', hours: 'hours', minute: 'minute', minutes: 'minutes', second: 'second', seconds: 'seconds', and: 'and' },
                    list: ({ guilds, users, commands, uptime }: InfoStatsText) =>
                        `${emoji(EmojiKey.StarBlack)} **::** Servers: \`${guilds}\`\n${emoji(EmojiKey.StarYellow)} **::** Users: \`${users}\`\n${emoji(EmojiKey.StarPurple)} **::** Commands: \`${commands}\`\n${emoji(EmojiKey.LoadingGreen)} **::** Uptime: \`${uptime}\``
                },
                resources: {
                    title: 'Resources',
                    list: (cpu: number, ram: number) =>
                        `${emoji(EmojiKey.Cpu)} **::** CPU: \`${cpu.toFixed(1)}%\`\n${emoji(EmojiKey.Ram)} **::** RAM: \`${ram.toFixed(1)} MB\``
                },
                credits: {
                    text: `${emoji(EmojiKey.Developer)} **::** Developed by **ether** ${emoji(EmojiKey.Heart)}`
                }
            },
            me: {
                name: 'me',
                description: 'Checks if you (or a user) are on the UBFB blacklist.',
                option: {
                    name: 'user',
                    description: 'User to check. Defaults to yourself.'
                },
                clean: (userId: string) => `${emoji(EmojiKey.Success)} <@${userId}> isn't on the UBFB blacklist.`,
                blacklisted: (userId: string) => `🚫 <@${userId}> is on the UBFB blacklist.`,
                reason: 'Reason',
                status: 'Status'
            },
            appeal: {
                name: 'appeal',
                description: 'Tells you where to appeal if you are on the UBFB blacklist.',
                message: `${emoji(EmojiKey.Attachment)} You can appeal your blacklist entry at https://ubfb.theindiebrand.es/panel.`
            },
            report: {
                name: 'report',
                description: 'Reports a user to the UBFB blacklist.',
                option: {
                    user: {
                        name: 'user',
                        description: 'User you want to report.'
                    },
                    reason: {
                        name: 'reason',
                        description: 'Reason for the report.'
                    },
                    proof: {
                        name: 'proof',
                        description: 'Link to an image proving the reason.'
                    },
                    proof2: {
                        name: 'proof2',
                        description: 'Another proof link, if you have one.'
                    },
                    proof3: {
                        name: 'proof3',
                        description: 'Another proof link, if you have one.'
                    }
                },
                success: "✅ Report sent. UBFB's team will review it.",
                alreadyPending: `${emoji(EmojiKey.Error)} That user already has a pending report.`,
                invalidProof: "❌ That proof link isn't valid, it must be an image."
            },
            cache: {
                name: 'cache',
                description: "Inspect/warm/invalidate a guild's GuildConfigCache entry.",
                usage: 'Use `/cache info`, `/cache hit`, or `/cache reload`.',
                noGuild: `${emoji(EmojiKey.Error)} No guild id given, and this was not run in a guild.`,
                notCached: (guildId: string) => `${emoji(EmojiKey.Error)} Nothing cached for \`${guildId}\` right now.`,
                noRow: (guildId: string) => `${emoji(EmojiKey.Error)} \`${guildId}\` has no row in the database at all.`,
                hitResult: (ms: string) => `⏱️ Cache miss round-trip: \`${ms}ms\`.`,
                reloaded: (guildId: string) => `${emoji(EmojiKey.Success)} Reloaded the cache entry for \`${guildId}\`.`,
                option: {
                    guildId: {
                        name: 'guild_id',
                        description: 'Guild id to check — defaults to the current server.'
                    }
                },
                info: {
                    name: 'info',
                    description: "Shows what's currently cached for a guild, without touching the database."
                },
                hit: {
                    name: 'hit',
                    description: 'Forces a cache miss for a guild and reports how long re-fetching it took.'
                },
                reload: {
                    name: 'reload',
                    description: "Force-invalidates and re-fetches a guild's cache entry."
                }
            }
        }
    },
    systems: {
        antiraid: {
            banReason: 'Raid detected.'
        },
        antibots: {
            kickReason: 'Bots are not allowed to join this server.'
        },
        maliciousMember: {
            ownerDmMark: (userId: string, reason: string) =>
                `${emoji(EmojiKey.Warning)} A known malicious user (<@${userId}>) joined your server. I changed their nickname to \`${reason}\` to flag them.`,
            ownerDmBan: (userId: string, reason: string) => `${emoji(EmojiKey.Warning)} A known malicious user (<@${userId}>) joined your server. I banned them.\n**Reason:** ${reason}`
        },
        raidmode: {
            joinBanReason: 'Raidmode is active — no joins are allowed right now.',
            actionBanReason: 'Raidmode is active — no channel/role/ban changes are allowed right now.'
        },
        raidBotAdder: {
            banReason: (botId: string) => `Added a bot (\`${botId}\`) that was banned as a raider.`
        },
        selfbot: {
            actionReason: 'This account was flagged as likely a selfbot/fake account on join.'
        },
        intelligentSos: {
            alert: (guildName: string, guildId: string, invite: string) => `@everyone 🆘 **S.O.S.** from \`${guildName}\` (${guildId})!\n${invite}`,
            automaticAlert: (guildName: string, guildId: string, invite: string, reason: string) =>
                `@everyone 🆘 **Automatic S.O.S.** from \`${guildName}\` (${guildId})!\n**Reason:** ${reason}\n${invite}`
        },
        pagination: {
            empty: 'There is nothing more to show.',
            back: '◀ Back'
        },
        support: {
            opening: {
                title: (subject: string) => `🎫 ${subject}`,
                description: (userId: string, username: string) =>
                    `Ticket opened from the web by <@${userId}> (**${username}**, \`${userId}\`).\nStaff reply by writing in this channel. Messages starting with \`//\` are internal notes: they never reach the user.`,
                closeButton: 'Close ticket'
            },
            message: {
                attachment: '[attachment not available on the web]',
                unknownUser: 'user',
                unknownRole: 'role',
                unknownChannel: 'channel'
            },
            close: {
                notice: {
                    user: '🔒 Ticket closed by the user from the web.',
                    staff: (staffId: string) => `🔒 Ticket closed by <@${staffId}>.`
                },
                button: {
                    notStaff: `${emoji(EmojiKey.Error)} Only staff can close tickets.`,
                    notTicket: `${emoji(EmojiKey.Error)} This channel is not a ticket.`,
                    started: `${emoji(EmojiKey.LoadingBlue)} Closing the ticket…`,
                    already: 'ℹ️ This ticket is already being closed.',
                    failed: `${emoji(EmojiKey.Error)} Could not start the close. Try again.`
                },
                truncated: (omitted: number) => `${emoji(EmojiKey.Warning)} The web only received the newest messages: the ${omitted} oldest ones don't fit its size limit. They are in the attached copy.`,
                dm: (subject: string) => `🔒 Your ticket «${subject}» has been closed. You can read the conversation on the web, in your support history.`,
                staffCopy: (subject: string, userId: string, by: string) => `${emoji(EmojiKey.Document)} Ticket **${subject}** from <@${userId}> closed ${by}. Copy with the internal notes attached.`,
                deliveryFailed: (subject: string, channelId: string, reason: string) =>
                    `${emoji(EmojiKey.Warning)} Could not deliver the transcript of ticket **${subject}** (<#${channelId}>) to the web: ${reason}. The channel stays locked and undeleted; it will be retried when the bot restarts. Copy attached.`
            },
            transcript: {
                header: (subject: string, ticketId: string, userId: string, openedAt: string, closedAt: string, by: string) =>
                    `Ticket: ${subject}\nID: ${ticketId}\nUser: ${userId}\nOpened: ${openedAt}\nClosed: ${closedAt} (${by})`,
                staffTruncated: (omitted: number) => `[… ${omitted} earlier messages omitted for size …]`,
                closedByUser: 'by the user',
                closedByStaff: 'by staff',
                authors: {
                    user: 'user',
                    staff: 'staff',
                    note: 'internal note'
                }
            }
        },
        verification: {
            dm: (link: string) => `${emoji(EmojiKey.Welcome)} Welcome! To access this server, verify yourself here:\n${link}\n\nThis link expires in 15 minutes.`
        },
        automod: {
            reason: {
                flood: () => 'Sending messages too quickly.',
                ghostping: () => 'Mentioning someone and deleting the message shortly after.',
                capsLock: () => 'Excessive use of capital letters.',
                manyEmojis: () => 'Too many emojis in one message.',
                manyWords: () => 'Message too long.',
                nativeAutomod: () => "Flagged by the server's own Discord AutoMod rules."
            },
            announce: {
                ghostping: (userId: string, mentionedUserId?: string) =>
                    mentionedUserId
                        ? `🕵️ <@${userId}> mentioned <@${mentionedUserId}> and deleted the message shortly after.`
                        : `🕵️ <@${userId}> mentioned someone and deleted the message shortly after.`,
                capsLock: (userId: string) => `🔠 <@${userId}>, ease up on the caps lock.`,
                manyEmojis: (userId: string) => `🙂 <@${userId}>, that's a lot of emojis for one message.`,
                manyWords: (userId: string) => `📝 <@${userId}>, that message was too long.`
            },
            webhookFloodReason: () => 'Webhook flood.'
        },
        cooldown: {
            blocked: (seconds: number) => `${emoji(EmojiKey.Error)} Slow down — try again in \`${seconds}s\`.`
        },
        logs: {
            events: {
                channelCreate: (channelId: string) => `📁 A channel was created: <#${channelId}>.`,
                channelDelete: (channelId: string) => `🗑️ A channel was deleted: \`${channelId}\`.`,
                channelUpdate: (channelId: string) => `✏️ A channel was updated: <#${channelId}>.`,
                roleCreate: (roleId: string) => `${emoji(EmojiKey.Success)} A role was created: <@&${roleId}>.`,
                roleDelete: (roleId: string) => `🗑️ A role was deleted: \`${roleId}\`.`,
                webhookCreate: () => '🪝 A webhook was created.',
                ban: (userId: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` was banned.`,
                unban: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` was unbanned.`,
                raidDetected: (userId: string) => `${emoji(EmojiKey.Raid)} Raid detected — banned <@${userId}>.`,
                antibotsKick: (userId: string) => `🤖 <@${userId}> was kicked — bots aren't allowed to join.`,
                antiraidDisabled: () =>
                    "⚠️ Antiraid was turned off automatically: I no longer have Ban Members/View Audit Log, or another role sits above mine. Fix that and turn it back on.",
                logsDisabled: () => `${emoji(EmojiKey.Warning)} The log channel was unset after a failed send. Set a new one to turn logs back on.`,
                maliciousMemberNone: (userId: string) => `👁️ A known malicious user (<@${userId}>) joined — no action taken.`,
                maliciousMemberMark: (userId: string) => `🚩 A known malicious user (<@${userId}>) joined — nickname changed to flag them.`,
                maliciousMemberBan: (userId: string) => `${emoji(EmojiKey.Ban)} A known malicious user (<@${userId}>) joined — banned.`,
                raidmodeJoinBan: (userId: string) => `🔒 <@${userId}> joined during raidmode — temp-banned.`,
                raidmodeActionBan: (userId: string) => `🔒 <@${userId}> made a change during raidmode — banned.`,
                raidmodeExpired: () => '🔓 Raidmode expired and was turned off automatically.',
                selfbotKick: (userId: string) => `🕵️ <@${userId}> was flagged as a likely selfbot/fake account — kicked.`,
                selfbotBan: (userId: string) => `🕵️ <@${userId}> was flagged as a likely selfbot/fake account — banned.`,
                automodViolation: (userId: string, detector: string, sanction: string) =>
                    `${emoji(EmojiKey.Warning)} <@${userId}> tripped automod (\`${detector}\`) — \`${sanction}\`.`,
                webhookFloodPurge: (webhookId: string) => `🪝 Deleted webhook \`${webhookId}\` for flooding.`,
                raidBotAdderBan: (userId: string, botId: string) => `${emoji(EmojiKey.Ban)} <@${userId}> added \`${botId}\`, which was just banned as a raider — banned too.`
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `${emoji(EmojiKey.Ban)} <@${userId}> has been banned.` + (reason ? `\n**Reason:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `${emoji(EmojiKey.Warning)} <@${userId}> has been warned.\n**Reason:** ${reason}`,
                unban: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` has been unbanned.`,
                forceban: (banned: number, total: number) => `${emoji(EmojiKey.Ban)} Force-banned \`${banned}\`/\`${total}\` blacklist entries.`,
                hackban: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` has been banned (hackban).\n**Reason:** ${reason}`,
                kick: (userId: string, reason: string) => `👢 <@${userId}> has been kicked.\n**Reason:** ${reason}`,
                timeout: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> timed out for \`${minutes}\` minutes.\n**Reason:** ${reason}`,
                untimeout: (userId: string) => `${emoji(EmojiKey.Success)} Removed the timeout from <@${userId}>.`,
                unwarn: (userId: string, warnId: number | 'all') =>
                    `${emoji(EmojiKey.Success)} Removed warning(s) from <@${userId}> (${warnId === 'all' ? 'all' : `#${warnId}`}).`,
                clear: (amount: number, channelId: string) => `🧹 Cleared \`${amount}\` messages in <#${channelId}>.`,
                lock: (roleId: string, channelId: string) => `🔒 Locked <#${channelId}> for <@&${roleId}>.`,
                unlock: (roleId: string, channelId: string) => `🔓 Unlocked <#${channelId}> for <@&${roleId}>.`,
                backupCreate: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Backup)} Backup created: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                backupLoad: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Backup)} Backup restored: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                tempban: (userId: string, minutes: number, reason: string) =>
                    `${emoji(EmojiKey.Ban)} <@${userId}> temp-banned for \`${minutes}\` minutes.\n**Reason:** ${reason}`,
                nuke: (channelId: string) => `💥 Channel <#${channelId}> was nuked (deleted and recreated).`,
                backupDelete: () => "🗑️ This server's backup was deleted.",
                channelCreate: (channelId: string) => `${emoji(EmojiKey.Success)} Channel <#${channelId}> was created.`,
                channelDelete: (channelId: string) => `🗑️ Channel \`${channelId}\` was deleted.`,
                createInvite: (channelId: string, code: string) => `${emoji(EmojiKey.Success)} Invite \`${code}\` created for <#${channelId}>.`,
                setIcon: () => "✅ This server's icon was changed.",
                setName: (name: string) => `${emoji(EmojiKey.Success)} This server's name was changed to \`${name}\`.`,
                addRole: (userId: string, roleId: string) => `${emoji(EmojiKey.Success)} Added <@&${roleId}> to <@${userId}>.`,
                removeRole: (userId: string, roleId: string) => `${emoji(EmojiKey.Success)} Removed <@&${roleId}> from <@${userId}>.`,
                setNickname: (userId: string, nickname: string) => `${emoji(EmojiKey.Success)} Changed <@${userId}>'s nickname to \`${nickname}\`.`,
                unnukeBans: (removed: number) => `🧹 Unnuke: removed \`${removed}\` bans.`,
                unnukeChannels: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate channels.`,
                unnukeRoles: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate roles.`,
                unnukeEmojis: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate emojis.`
            }
        },
        commands: {
            optionsError: (options: string) => `${emoji(EmojiKey.Error)} Check what you wrote, something isn't valid: \`${options}\`.`,
            permissionsFail: (permissions: string) => `${emoji(EmojiKey.Error)} You're missing permissions to use this: \`${permissions}\`.`,
            botPermissionsFail: (permissions: string) => `${emoji(EmojiKey.Error)} I'm missing permissions to do this: \`${permissions}\`.`,
            middlewaresError: (reason: string) => `${emoji(EmojiKey.Error)} ${reason}`,
            runError: `${emoji(EmojiKey.Error)} Something went wrong running that command.`,
            ownerOnly: 'Only the server owner can use this command.'
        }
    }
};

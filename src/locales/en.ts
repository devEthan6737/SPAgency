export default {
    commands: {
        configuration: {
            ping: {
                name: 'ping',
                description: 'Shows the bot latency.',
                calculating: 'Calculating...',
                latency: (message: number, api: number) =>
                    `🌐 Message latency: \`${message}ms\`\n🤖 API latency: \`${api}ms\``,
                withDatabase: (message: number, api: number, database: number) =>
                    `🌐 Message latency: \`${message}ms\`\n🤖 API latency: \`${api}ms\`\n📚 Database latency: \`${database}ms\``
            },
            channel: {
                name: 'channel',
                description: 'Manage your server channels.',
                usage: 'Use `/channel create` or `/channel delete`.',
                created: '✅ Channel created.',
                deleted: '✅ Channel deleted.',
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
                    done: '✅ Server name updated.'
                },
                setIcon: {
                    name: 'set-icon',
                    description: "Changes the server's icon.",
                    option: { url: { name: 'url', description: 'Link to the new icon image.' } },
                    done: '✅ Server icon updated.',
                    invalidUrl: "❌ Couldn't download that image."
                },
                createInvite: {
                    name: 'create-invite',
                    description: 'Creates an invite for a random text channel.',
                    done: (invite: string) => `✅ Invite created: ${invite}`,
                    noChannel: '❌ No text channel is available.'
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
                    done: '✅ Nickname updated.'
                },
                addRole: {
                    name: 'add-role',
                    description: 'Adds a role to a member.',
                    done: '✅ Role added.'
                },
                removeRole: {
                    name: 'remove-role',
                    description: 'Removes a role from a member.',
                    done: '✅ Role removed.'
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
                started: "⏳ Cleaning up, this might take a moment...",
                done: (removed: number) => `✅ Done. Removed \`${removed}\` entries.`,
                channels: { name: 'channels', description: 'Deletes channels with a duplicate name.' },
                roles: { name: 'roles', description: 'Deletes roles with a duplicate name.' },
                emojis: { name: 'emojis', description: 'Deletes emojis with a duplicate name.' },
                bans: { name: 'bans', description: 'Unbans every currently banned user.' }
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
                done: (amount: number) => `✅ Deleted \`${amount}\` messages.`
            },
            nuke: {
                name: 'nuke',
                description: 'Deletes and recreates this channel, wiping all its messages.',
                notText: '❌ This can only be used in text channels.',
                confirm: "⚠️ This will delete **all** messages in this channel and can't be undone. Are you sure?",
                confirmLabel: 'Yes, wipe it',
                cancelLabel: 'Cancel',
                done: '✅ Channel reset.'
            },
            shared: {
                cannotTargetBot: "❌ I can't do that to myself.",
                cannotTargetSelf: "❌ You can't do that to yourself.",
                hierarchyError: "❌ You can't moderate someone with a role equal to or higher than your own.",
                defaultReason: 'No reason specified.',
                dm: (guildName: string, reason: string) => `You received a moderation action in \`${guildName}\`.\n**Reason:** ${reason}`,
                forceReasonRequired: (allowed: string[]) =>
                    `❌ This server requires one of its predefined reasons: ${allowed.map((reason) => `\`${reason}\``).join(', ')}.`
            },
            ban: {
                name: 'ban',
                description: 'Bans a member from your server.',
                option: {
                    member: { name: 'member', description: 'Member to ban.' },
                    reason: { name: 'reason', description: 'Ban reason.' }
                },
                done: (userId: string, reason: string) => `🔨 <@${userId}> has been banned.\n**Reason:** ${reason}`
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
                done: (userId: string, reason: string) => `🔨 \`${userId}\` has been banned.\n**Reason:** ${reason}`
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
                scanning: '🔎 Scanning members, this might take a moment...',
                noneFound: '✅ No malicious users found.',
                found: (count: number, guildName: string) => `🚫 Found \`${count}\` malicious users in \`${guildName}\`:`,
                entry: (userId: string, reason: string) => `<@${userId}> — Reason: \`${reason}\``,
                entryUnknownReason: (userId: string) => `<@${userId}> — Unknown reason`
            },
            forceban: {
                name: 'forceban',
                description: 'Bans every UBFB blacklist entry from your server, member or not.',
                option: { reason: { name: 'reason', description: 'Only ban blacklist entries with this reason. Defaults to everyone.' } },
                noneMatching: '❌ No blacklist entries match.',
                confirm: (count: number) => `⚠️ This will ban \`${count}\` users from the UBFB blacklist. Are you sure?`,
                confirmLabel: 'Yes, ban them all',
                cancelLabel: 'Cancel',
                done: (banned: number, total: number) => `✅ Banned \`${banned}\`/\`${total}\` users.`
            },
            sos: {
                name: 'sos',
                description: 'Pings SPAgency staff with a fresh invite to this server. For emergencies.',
                noStaffChannel: "❌ The staff alert channel isn't configured — contact SPAgency support directly.",
                noChannel: '❌ No text channel is available to create the invite.',
                alert: (guildName: string, guildId: string, invite: string) =>
                    `@everyone 🆘 **S.O.S.** from \`${guildName}\` (${guildId})!\n${invite}`,
                done: '✅ Alert sent.'
            },
            baninfo: {
                name: 'baninfo',
                description: "Shows a server ban's details.",
                option: { user: { name: 'user', description: 'User to check.' } },
                notBanned: "❌ That user isn't banned.",
                noReason: 'No reason specified',
                info: (username: string, reason: string) => `🔨 \`${username}\` is banned.\n**Reason:** ${reason}`
            },
            unban: {
                name: 'unban',
                description: 'Unbans a user from your server.',
                option: { id: { name: 'id', description: 'ID of the user to unban.' } },
                invalidId: "❌ That isn't a valid id.",
                notBanned: "❌ That user isn't banned.",
                done: (userId: string) => `✅ \`${userId}\` has been unbanned.`
            },
            untimeout: {
                name: 'untimeout',
                description: "Removes a member's timeout.",
                option: { member: { name: 'member', description: 'Member to remove the timeout from.' } },
                notAMember: "❌ That user isn't a member of this server.",
                failed: "❌ I couldn't remove that user's timeout.",
                done: (userId: string) => `✅ Removed the timeout from <@${userId}>.`
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
                    `🔨 <@${userId}> banned for \`${minutes}\` minutes.\n**Reason:** ${reason}`
            },
            warn: {
                name: 'warn',
                description: 'Adds a warning to a member.',
                option: {
                    member: { name: 'member', description: 'Member to warn.' },
                    reason: { name: 'reason', description: 'Warn reason.' }
                },
                done: (userId: string, total: number, reason: string) =>
                    `⚠️ <@${userId}> warned (\`${total}\` total).\n**Reason:** ${reason}`
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
                needsIdOrAll: '❌ Specify `id` or set `all` to true.',
                notFound: "❌ There's no warning with that id for that user.",
                done: (userId: string, id: number) => `✅ Removed warning \`#${id}\` from <@${userId}>.`,
                doneAll: (userId: string, total: number) => `✅ Removed \`${total}\` warnings from <@${userId}>.`
            },
            backup: {
                name: 'backup',
                description: 'Snapshot and restore this server (channels, roles, bans, emojis, stickers).',
                usage: 'Use `/backup create`, `/backup info`, `/backup load`, or `/backup delete`.',
                none: "❌ This server doesn't have a saved backup.",
                deleted: '✅ Backup deleted.',
                overwritePrompt: '⚠️ This will replace the existing backup — the old one will be lost. Are you sure?',
                overwriteYes: 'Yes, overwrite it',
                overwriteNo: 'Cancel',
                deletePrompt: "⚠️ This will permanently delete this server's backup. Are you sure?",
                deleteYes: 'Yes, delete it',
                deleteNo: 'Cancel',
                creating: '⏳ Creating backup, this might take a moment...',
                created: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `✅ Backup created: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                details: (name: string, channels: number, roles: number, bans: number, emojis: number, stickers: number, createdAt: Date) =>
                    `📦 Backup of \`${name}\`, taken <t:${Math.floor(createdAt.getTime() / 1000)}:R>.\n\`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                cleanupPrompt: '⚠️ Clean up duplicate-named channels/roles (from a raid) before restoring?',
                cleanupYes: 'Yes, clean up first',
                cleanupNo: 'No, just restore',
                restoring: '⏳ Restoring, this might take a moment...',
                restored: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `✅ Restored \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, and \`${stickers}\` stickers that were missing.`,
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
                intro: 'Here are all my commands.',
                categories: {
                    configuration: '⚙️ Configuration',
                    moderation: '🛡️ Moderation',
                    others: '📦 Others'
                },
                option: {
                    name: 'command',
                    description: 'Name of the command to look up.'
                },
                notFound: (name: string) => `❌ There's no command called \`${name}\`.`,
                usage: {
                    options: 'Options',
                    required: 'required',
                    noOptions: 'This command has no options.'
                }
            },
            me: {
                name: 'me',
                description: 'Checks if you (or a user) are on the UBFB blacklist.',
                option: {
                    name: 'user',
                    description: 'User to check. Defaults to yourself.'
                },
                clean: (userId: string) => `✅ <@${userId}> isn't on the UBFB blacklist.`,
                blacklisted: (userId: string) => `🚫 <@${userId}> is on the UBFB blacklist.`,
                reason: 'Reason',
                status: 'Status'
            },
            appeal: {
                name: 'appeal',
                description: 'Tells you where to appeal if you are on the UBFB blacklist.',
                message: 'You can appeal your blacklist entry at https://ubfb.theindiebrand.es/panel.'
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
                alreadyPending: '❌ That user already has a pending report.',
                invalidProof: "❌ That proof link isn't valid, it must be an image."
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
        cooldown: {
            blocked: (seconds: number) => `❌ Slow down — try again in \`${seconds}s\`.`
        },
        logs: {
            events: {
                memberJoin: (userId: string) => `📥 <@${userId}> joined the server.`,
                memberLeave: (userId: string) => `📤 <@${userId}> left the server.`,
                channelCreate: (channelId: string) => `📁 A channel was created: <#${channelId}>.`,
                channelDelete: (channelId: string) => `🗑️ A channel was deleted: \`${channelId}\`.`,
                channelUpdate: (channelId: string) => `✏️ A channel was updated: <#${channelId}>.`,
                roleCreate: (roleId: string) => `✅ A role was created: <@&${roleId}>.`,
                roleDelete: (roleId: string) => `🗑️ A role was deleted: \`${roleId}\`.`,
                webhookCreate: () => '🪝 A webhook was created.',
                ban: (userId: string) => `🔨 \`${userId}\` was banned.`,
                unban: (userId: string) => `✅ \`${userId}\` was unbanned.`,
                raidDetected: (userId: string) => `🚨 Raid detected — banned <@${userId}>.`,
                antibotsKick: (userId: string) => `🤖 <@${userId}> was kicked — bots aren't allowed to join.`,
                antiraidDisabled: () =>
                    "⚠️ Antiraid was turned off automatically: I no longer have Ban Members/View Audit Log, or another role sits above mine. Fix that and turn it back on.",
                logsDisabled: () => '⚠️ The log channel was unset after a failed send. Set a new one to turn logs back on.'
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `🔨 <@${userId}> has been banned.` + (reason ? `\n**Reason:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `⚠️ <@${userId}> has been warned.\n**Reason:** ${reason}`,
                unban: (userId: string) => `✅ \`${userId}\` has been unbanned.`,
                forceban: (banned: number, total: number) => `🔨 Force-banned \`${banned}\`/\`${total}\` blacklist entries.`,
                hackban: (userId: string, reason: string) => `🔨 \`${userId}\` has been banned (hackban).\n**Reason:** ${reason}`,
                kick: (userId: string, reason: string) => `👢 <@${userId}> has been kicked.\n**Reason:** ${reason}`,
                timeout: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> timed out for \`${minutes}\` minutes.\n**Reason:** ${reason}`,
                untimeout: (userId: string) => `✅ Removed the timeout from <@${userId}>.`,
                unwarn: (userId: string, warnId: number | 'all') =>
                    `✅ Removed warning(s) from <@${userId}> (${warnId === 'all' ? 'all' : `#${warnId}`}).`,
                clear: (amount: number, channelId: string) => `🧹 Cleared \`${amount}\` messages in <#${channelId}>.`,
                lock: (roleId: string, channelId: string) => `🔒 Locked <#${channelId}> for <@&${roleId}>.`,
                unlock: (roleId: string, channelId: string) => `🔓 Unlocked <#${channelId}> for <@&${roleId}>.`,
                backupCreate: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `📦 Backup created: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                backupLoad: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `📦 Backup restored: \`${channels}\` channels, \`${roles}\` roles, \`${bans}\` bans, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                tempban: (userId: string, minutes: number, reason: string) =>
                    `🔨 <@${userId}> temp-banned for \`${minutes}\` minutes.\n**Reason:** ${reason}`,
                nuke: (channelId: string) => `💥 Channel <#${channelId}> was nuked (deleted and recreated).`,
                backupDelete: () => "🗑️ This server's backup was deleted.",
                channelCreate: (channelId: string) => `✅ Channel <#${channelId}> was created.`,
                channelDelete: (channelId: string) => `🗑️ Channel \`${channelId}\` was deleted.`,
                createInvite: (channelId: string, code: string) => `✅ Invite \`${code}\` created for <#${channelId}>.`,
                setIcon: () => "✅ This server's icon was changed.",
                setName: (name: string) => `✅ This server's name was changed to \`${name}\`.`,
                addRole: (userId: string, roleId: string) => `✅ Added <@&${roleId}> to <@${userId}>.`,
                removeRole: (userId: string, roleId: string) => `✅ Removed <@&${roleId}> from <@${userId}>.`,
                setNickname: (userId: string, nickname: string) => `✅ Changed <@${userId}>'s nickname to \`${nickname}\`.`,
                unnukeBans: (removed: number) => `🧹 Unnuke: removed \`${removed}\` bans.`,
                unnukeChannels: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate channels.`,
                unnukeRoles: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate roles.`,
                unnukeEmojis: (removed: number) => `🧹 Unnuke: removed \`${removed}\` duplicate emojis.`
            }
        },
        commands: {
            optionsError: (options: string) => `❌ Check what you wrote, something isn't valid: \`${options}\`.`,
            permissionsFail: (permissions: string) => `❌ You're missing permissions to use this: \`${permissions}\`.`,
            botPermissionsFail: (permissions: string) => `❌ I'm missing permissions to do this: \`${permissions}\`.`,
            middlewaresError: (reason: string) => `❌ ${reason}`,
            runError: '❌ Something went wrong running that command.',
            ownerOnly: 'Only the server owner can use this command.'
        }
    }
};

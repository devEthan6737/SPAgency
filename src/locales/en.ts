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
                onCooldown: '❌ Wait before using this command again (15 minute cooldown).',
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
        logs: {
            events: {
                memberJoin: (userId: string) => `📥 <@${userId}> joined the server.`,
                memberLeave: (userId: string) => `📤 <@${userId}> left the server.`
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `🔨 <@${userId}> has been banned.` + (reason ? `\n**Reason:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `⚠️ <@${userId}> has been warned.\n**Reason:** ${reason}`
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

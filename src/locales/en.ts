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
            }
        },
        others: {
            commands: {
                name: 'commands',
                description: "Get all the bot's commands.",
                intro: 'Here are all my commands.',
                categories: {
                    configuration: '⚙️ Configuration',
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
            runError: '❌ Something went wrong running that command.'
        }
    }
};

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

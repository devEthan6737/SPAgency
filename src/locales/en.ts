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
        }
    }
};

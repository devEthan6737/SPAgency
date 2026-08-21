export default {
    commands: {
        configuration: {
            ping: {
                name: 'ping',
                description: 'Muestra la latencia del bot.',
                calculating: 'Calculando...',
                latency: (message: number, api: number) =>
                    `🌐 Latencia del mensaje: \`${message}ms\`\n🤖 Latencia de la API: \`${api}ms\``,
                withDatabase: (message: number, api: number, database: number) =>
                    `🌐 Latencia del mensaje: \`${message}ms\`\n🤖 Latencia de la API: \`${api}ms\`\n📚 Latencia de la base de datos: \`${database}ms\``
            }
        },
        others: {
            commands: {
                name: 'comandos',
                description: 'Obtén todos los comandos del bot.',
                intro: 'Aquí tienes todos mis comandos.',
                categories: {
                    configuration: '⚙️ Configuración',
                    others: '📦 Otros'
                }
            }
        }
    },
    systems: {
        logs: {
            events: {
                memberJoin: (userId: string) => `📥 <@${userId}> se ha unido al servidor.`,
                memberLeave: (userId: string) => `📤 <@${userId}> ha salido del servidor.`
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `🔨 <@${userId}> ha sido baneado.` + (reason ? `\n**Razón:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `⚠️ <@${userId}> ha sido advertido.\n**Razón:** ${reason}`
            }
        }
    }
};

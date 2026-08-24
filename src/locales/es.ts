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
                },
                option: {
                    name: 'comando',
                    description: 'Nombre del comando a consultar.'
                },
                notFound: (name: string) => `❌ No existe ningún comando llamado \`${name}\`.`,
                usage: {
                    options: 'Opciones',
                    required: 'requerido',
                    noOptions: 'Este comando no tiene opciones.'
                }
            },
            me: {
                name: 'me',
                description: 'Comprueba si tú (o un usuario) estáis en la blacklist de UBFB.',
                option: {
                    name: 'usuario',
                    description: 'Usuario a consultar. Por defecto, tú mismo.'
                },
                clean: (userId: string) => `✅ <@${userId}> no está en la blacklist de UBFB.`,
                blacklisted: (userId: string) => `🚫 <@${userId}> está en la blacklist de UBFB.`,
                reason: 'Razón',
                status: 'Estado'
            },
            appeal: {
                name: 'apelar',
                description: 'Indica dónde apelar si estás en la blacklist de UBFB.',
                message: 'Puedes apelar tu entrada en la blacklist en https://ubfb.theindiebrand.es/panel.'
            },
            report: {
                name: 'reporte',
                description: 'Reporta a un usuario a la blacklist de UBFB.',
                option: {
                    user: {
                        name: 'usuario',
                        description: 'Usuario que quieres reportar.'
                    },
                    reason: {
                        name: 'razon',
                        description: 'Motivo del reporte.'
                    },
                    proof: {
                        name: 'prueba',
                        description: 'Enlace a una imagen que demuestre el motivo.'
                    },
                    proof2: {
                        name: 'prueba2',
                        description: 'Otro enlace de prueba, si tienes uno.'
                    },
                    proof3: {
                        name: 'prueba3',
                        description: 'Otro enlace de prueba, si tienes uno.'
                    }
                },
                success: '✅ Reporte enviado. El equipo de UBFB lo revisará.',
                alreadyPending: '❌ Ese usuario ya tiene un reporte pendiente de revisión.',
                invalidProof: '❌ El enlace de la prueba no es válido, debe ser una imagen.'
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
        },
        commands: {
            optionsError: (options: string) => `❌ Revisa lo que has escrito, algo no es válido: \`${options}\`.`,
            permissionsFail: (permissions: string) => `❌ Te faltan permisos para usar esto: \`${permissions}\`.`,
            botPermissionsFail: (permissions: string) => `❌ Me faltan permisos para hacer esto: \`${permissions}\`.`,
            middlewaresError: (reason: string) => `❌ ${reason}`,
            runError: '❌ Ha ocurrido un error al ejecutar el comando.'
        }
    }
};

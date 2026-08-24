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
            },
            channel: {
                name: 'channel',
                description: 'Gestiona los canales de tu servidor.',
                usage: 'Usa `/channel create` o `/channel delete`.',
                created: '✅ Canal creado.',
                deleted: '✅ Canal eliminado.',
                create: {
                    name: 'create',
                    description: 'Crea un nuevo canal de texto.',
                    option: { name: { name: 'nombre', description: 'Nombre para el nuevo canal.' } }
                },
                delete: {
                    name: 'delete',
                    description: 'Elimina un canal.',
                    option: { channel: { name: 'canal', description: 'Canal a eliminar.' } }
                }
            },
            guild: {
                name: 'guild',
                description: 'Gestiona tu servidor.',
                usage: 'Usa `/guild set-name`, `/guild set-icon`, `/guild create-invite` o `/guild info`.',
                setName: {
                    name: 'set-name',
                    description: 'Cambia el nombre del servidor.',
                    option: { name: { name: 'nombre', description: 'Nuevo nombre del servidor.' } },
                    done: '✅ Nombre del servidor actualizado.'
                },
                setIcon: {
                    name: 'set-icon',
                    description: 'Cambia el icono del servidor.',
                    option: { url: { name: 'url', description: 'Enlace a la nueva imagen del icono.' } },
                    done: '✅ Icono del servidor actualizado.',
                    invalidUrl: '❌ No se pudo descargar esa imagen.'
                },
                createInvite: {
                    name: 'create-invite',
                    description: 'Crea una invitación en un canal de texto al azar.',
                    done: (invite: string) => `✅ Invitación creada: ${invite}`,
                    noChannel: '❌ No hay ningún canal de texto disponible.'
                },
                info: {
                    name: 'info',
                    description: 'Muestra información sobre el servidor.',
                    id: 'ID',
                    owner: 'Propietario',
                    createdAt: 'Creado el',
                    verificationLevel: 'Nivel de verificación',
                    boosts: 'Boosts'
                }
            },
            member: {
                name: 'member',
                description: 'Gestiona los miembros de tu servidor.',
                usage: 'Usa `/member set-nickname`, `/member add-role`, `/member remove-role` o `/member info`.',
                setNickname: {
                    name: 'set-nickname',
                    description: 'Cambia el apodo de un miembro.',
                    option: {
                        member: { name: 'miembro', description: 'Miembro a editar.' },
                        nickname: { name: 'apodo', description: 'Nuevo apodo.' }
                    },
                    done: '✅ Apodo actualizado.'
                },
                addRole: {
                    name: 'add-role',
                    description: 'Añade un rol a un miembro.',
                    done: '✅ Rol añadido.'
                },
                removeRole: {
                    name: 'remove-role',
                    description: 'Quita un rol a un miembro.',
                    done: '✅ Rol quitado.'
                },
                role: {
                    option: {
                        member: { name: 'miembro', description: 'Miembro a editar.' },
                        role: { name: 'rol', description: 'Rol a añadir/quitar.' }
                    },
                    hierarchyError: '❌ No puedes gestionar un rol igual o superior al tuyo.'
                },
                info: {
                    name: 'info',
                    description: 'Muestra información sobre un miembro.',
                    option: { member: { name: 'miembro', description: 'Miembro a consultar.' } },
                    id: 'ID',
                    nickname: 'Apodo',
                    noNickname: 'Sin apodo',
                    joinedAt: 'Entró el',
                    roles: 'Roles',
                    noRoles: 'Sin roles'
                }
            },
            unnuke: {
                name: 'unnuke',
                description: 'Limpieza automática tras un raid: canales/roles/emojis duplicados, o baneos masivos.',
                usage: 'Usa `/unnuke channels`, `/unnuke roles`, `/unnuke emojis` o `/unnuke bans`.',
                onCooldown: '❌ Espera antes de volver a usar este comando (cooldown de 15 minutos).',
                started: '⏳ Limpiando, esto puede tardar un poco...',
                done: (removed: number) => `✅ Hecho. Se han eliminado \`${removed}\` entradas.`,
                channels: { name: 'channels', description: 'Elimina canales duplicados por nombre.' },
                roles: { name: 'roles', description: 'Elimina roles duplicados por nombre.' },
                emojis: { name: 'emojis', description: 'Elimina emojis duplicados por nombre.' },
                bans: { name: 'bans', description: 'Desbanea a todos los usuarios baneados actualmente.' }
            }
        },
        moderation: {
            lock: {
                name: 'lock',
                description: 'Bloquea el canal para que solo el staff pueda escribir.',
                option: { role: { name: 'rol', description: 'Rol a bloquear. Por defecto, @everyone.' } },
                done: '🔒 Canal bloqueado.'
            },
            unlock: {
                name: 'unlock',
                description: 'Desbloquea el canal para que el rol pueda volver a escribir.',
                option: { role: { name: 'rol', description: 'Rol a desbloquear. Por defecto, @everyone.' } },
                done: '🔓 Canal desbloqueado.'
            },
            clear: {
                name: 'clear',
                description: 'Borra mensajes de este canal en bloque.',
                option: { amount: { name: 'cantidad', description: 'Cuántos mensajes borrar (1-1000).' } },
                done: (amount: number) => `✅ Se han borrado \`${amount}\` mensajes.`
            },
            nuke: {
                name: 'nuke',
                description: 'Borra y recrea este canal, eliminando todos sus mensajes.',
                notText: '❌ Esto solo se puede usar en canales de texto.',
                confirm: '⚠️ Esto borrará **todos** los mensajes de este canal y no se puede deshacer. ¿Seguro?',
                confirmLabel: 'Sí, borrar todo',
                cancelLabel: 'Cancelar',
                done: '✅ Canal reiniciado.'
            }
        },
        others: {
            commands: {
                name: 'comandos',
                description: 'Obtén todos los comandos del bot.',
                intro: 'Aquí tienes todos mis comandos.',
                categories: {
                    configuration: '⚙️ Configuración',
                    moderation: '🛡️ Moderación',
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
            runError: '❌ Ha ocurrido un error al ejecutar el comando.',
            ownerOnly: 'Solo el propietario del servidor puede usar este comando.'
        }
    }
};

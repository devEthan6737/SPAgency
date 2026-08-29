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
            },
            shared: {
                cannotTargetBot: '❌ No puedo hacer eso conmigo mismo.',
                cannotTargetSelf: '❌ No puedes hacerte eso a ti mismo.',
                hierarchyError: '❌ No puedes moderar a alguien con un rol igual o superior al tuyo.',
                defaultReason: 'No se especificó ninguna razón.',
                dm: (guildName: string, reason: string) => `Has recibido una acción de moderación en \`${guildName}\`.\n**Razón:** ${reason}`
            },
            ban: {
                name: 'ban',
                description: 'Banea a un miembro de tu servidor.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a banear.' },
                    reason: { name: 'razon', description: 'Razón del baneo.' }
                },
                done: (userId: string, reason: string) => `🔨 <@${userId}> ha sido baneado.\n**Razón:** ${reason}`
            },
            kick: {
                name: 'kick',
                description: 'Expulsa a un miembro de tu servidor.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a expulsar.' },
                    reason: { name: 'razon', description: 'Razón de la expulsión.' }
                },
                notAMember: '❌ Ese usuario no es miembro de este servidor.',
                done: (userId: string, reason: string) => `👢 <@${userId}> ha sido expulsado.\n**Razón:** ${reason}`
            },
            hackban: {
                name: 'hackban',
                description: 'Banea a un usuario que no es miembro de tu servidor, por id.',
                option: {
                    id: { name: 'id', description: 'ID del usuario a banear — no hace falta que sea miembro de este servidor.' },
                    reason: { name: 'razon', description: 'Razón del baneo.' }
                },
                invalidId: '❌ Eso no es una id válida.',
                failed: '❌ No he podido banear a ese usuario.',
                done: (userId: string, reason: string) => `🔨 \`${userId}\` ha sido baneado.\n**Razón:** ${reason}`
            },
            timeout: {
                name: 'timeout',
                description: 'Aislamiento nativo de Discord — silencia a un miembro durante un tiempo.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a aislar.' },
                    minutes: { name: 'minutos', description: 'Duración en minutos (10-40320, el límite de Discord son 28 días).' },
                    reason: { name: 'razon', description: 'Razón del aislamiento.' }
                },
                notAMember: '❌ Ese usuario no es miembro de este servidor.',
                failed: '❌ No he podido aislar a ese usuario.',
                done: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> ha sido aislado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`
            },
            detect: {
                name: 'detect',
                description: 'Escanea los miembros de tu servidor contra la blacklist de UBFB.',
                scanning: '🔎 Escaneando miembros, esto puede tardar un poco...',
                noneFound: '✅ No se ha encontrado ningún usuario malicioso.',
                found: (count: number, guildName: string) => `🚫 Se han encontrado \`${count}\` usuarios maliciosos en \`${guildName}\`:`,
                entry: (userId: string, reason: string) => `<@${userId}> — Razón: \`${reason}\``,
                entryUnknownReason: (userId: string) => `<@${userId}> — Razón desconocida`
            },
            forceban: {
                name: 'forceban',
                description: 'Banea a todos los de la blacklist de UBFB de tu servidor, sean miembros o no.',
                option: { reason: { name: 'razon', description: 'Solo banea entradas de la blacklist con esta razón. Por defecto, todas.' } },
                noneMatching: '❌ No hay ninguna entrada de la blacklist que coincida.',
                confirm: (count: number) => `⚠️ Esto baneará a \`${count}\` usuarios de la blacklist de UBFB. ¿Seguro?`,
                confirmLabel: 'Sí, banear a todos',
                cancelLabel: 'Cancelar',
                done: (banned: number, total: number) => `✅ Baneados \`${banned}\`/\`${total}\` usuarios.`
            },
            sos: {
                name: 'sos',
                description: 'Avisa al staff de SPAgency con una invitación nueva a este servidor. Para emergencias.',
                noStaffChannel: '❌ El canal de alertas del staff no está configurado — contacta directamente con el soporte de SPAgency.',
                noChannel: '❌ No hay ningún canal de texto disponible para crear la invitación.',
                alert: (guildName: string, guildId: string, invite: string) =>
                    `@everyone 🆘 **S.O.S.** de \`${guildName}\` (${guildId})!\n${invite}`,
                done: '✅ Aviso enviado.'
            },
            baninfo: {
                name: 'baninfo',
                description: "Muestra los detalles de un baneo del servidor.",
                option: { user: { name: 'usuario', description: 'Usuario a consultar.' } },
                notBanned: '❌ Ese usuario no está baneado.',
                noReason: 'Sin razón especificada',
                info: (username: string, reason: string) => `🔨 \`${username}\` está baneado.\n**Razón:** ${reason}`
            },
            unban: {
                name: 'unban',
                description: 'Desbanea a un usuario de tu servidor.',
                option: { id: { name: 'id', description: 'ID del usuario a desbanear.' } },
                invalidId: '❌ Eso no es una id válida.',
                notBanned: '❌ Ese usuario no está baneado.',
                done: (userId: string) => `✅ \`${userId}\` ha sido desbaneado.`
            },
            untimeout: {
                name: 'untimeout',
                description: 'Elimina el aislamiento de un miembro.',
                option: { member: { name: 'miembro', description: 'Miembro al que quitar el aislamiento.' } },
                notAMember: '❌ Ese usuario no es miembro de este servidor.',
                failed: '❌ No he podido quitarle el aislamiento a ese usuario.',
                done: (userId: string) => `✅ Se ha eliminado el aislamiento de <@${userId}>.`
            },
            tempban: {
                name: 'tempban',
                description: 'Banea a un miembro durante un tiempo, y lo desbanea automáticamente al terminar.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a banear temporalmente.' },
                    minutes: { name: 'minutos', description: 'Duración del baneo en minutos (mínimo 2).' },
                    reason: { name: 'razon', description: 'Razón del baneo.' }
                },
                autoUnbanReason: 'Fin del baneo temporal.',
                done: (userId: string, minutes: number, reason: string) =>
                    `🔨 <@${userId}> baneado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`
            },
            warn: {
                name: 'warn',
                description: 'Añade un aviso a un miembro.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a avisar.' },
                    reason: { name: 'razon', description: 'Razón del aviso.' }
                },
                done: (userId: string, total: number, reason: string) =>
                    `⚠️ <@${userId}> avisado (\`${total}\` en total).\n**Razón:** ${reason}`
            },
            warns: {
                name: 'warns',
                description: 'Lista los avisos de un miembro.',
                option: { member: { name: 'miembro', description: 'Miembro a consultar.' } },
                none: '✅ Ese usuario no tiene avisos.',
                intro: (userId: string, total: number) => `<@${userId}> tiene \`${total}\` aviso(s):`,
                entry: (id: number, reason: string, moderatorId: string) => `\`#${id}\` — ${reason} (por <@${moderatorId}>)`
            },
            unwarn: {
                name: 'unwarn',
                description: 'Elimina uno (o todos) los avisos de un miembro.',
                option: {
                    member: { name: 'miembro', description: 'Miembro al que quitar un aviso.' },
                    id: { name: 'id', description: 'ID del aviso concreto a eliminar (ver /warns).' },
                    all: { name: 'todos', description: 'Elimina todos los avisos de este miembro en vez de uno.' }
                },
                needsIdOrAll: '❌ Especifica `id` o pon `todos` en `true`.',
                notFound: '❌ No existe ningún aviso con esa id para ese usuario.',
                done: (userId: string, id: number) => `✅ Eliminado el aviso \`#${id}\` de <@${userId}>.`,
                doneAll: (userId: string, total: number) => `✅ Eliminados \`${total}\` avisos de <@${userId}>.`
            },
            backup: {
                name: 'backup',
                description: 'Guarda y restaura una copia de este servidor (canales, roles, baneos, emojis, stickers).',
                usage: 'Usa `/backup create`, `/backup info`, `/backup load`, o `/backup delete`.',
                none: '❌ Este servidor no tiene ningún backup guardado.',
                deleted: '✅ Backup eliminado.',
                overwritePrompt: '⚠️ Esto reemplazará el backup existente — el anterior se perderá. ¿Estás seguro?',
                overwriteYes: 'Sí, sobrescribirlo',
                overwriteNo: 'Cancelar',
                deletePrompt: '⚠️ Esto eliminará permanentemente el backup de este servidor. ¿Estás seguro?',
                deleteYes: 'Sí, eliminarlo',
                deleteNo: 'Cancelar',
                creating: '⏳ Creando backup, esto puede tardar un momento...',
                created: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `✅ Backup creado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                details: (name: string, channels: number, roles: number, bans: number, emojis: number, stickers: number, createdAt: Date) =>
                    `📦 Backup de \`${name}\`, tomado <t:${Math.floor(createdAt.getTime() / 1000)}:R>.\n\`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                cleanupPrompt: '⚠️ ¿Limpiar canales/roles duplicados (de un raid) antes de restaurar?',
                cleanupYes: 'Sí, limpiar primero',
                cleanupNo: 'No, solo restaurar',
                restoring: '⏳ Restaurando, esto puede tardar un momento...',
                restored: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `✅ Restaurados \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis y \`${stickers}\` stickers que faltaban.`,
                create: {
                    name: 'create',
                    description: 'Guarda una copia de este servidor (canales, roles, baneos, emojis, stickers) para restaurarla luego.'
                },
                info: { name: 'info', description: 'Muestra el backup guardado de este servidor, si existe.' },
                load: {
                    name: 'load',
                    description: 'Restaura lo que falte (canales, roles, baneos, emojis, stickers) desde el backup guardado.'
                },
                delete: { name: 'delete', description: 'Elimina el backup guardado de este servidor.' }
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
        antiraid: {
            banReason: 'Raid detectado.'
        },
        cooldown: {
            blocked: (seconds: number) => `❌ Espera un poco — inténtalo de nuevo en \`${seconds}s\`.`
        },
        logs: {
            events: {
                memberJoin: (userId: string) => `📥 <@${userId}> se ha unido al servidor.`,
                memberLeave: (userId: string) => `📤 <@${userId}> ha salido del servidor.`
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `🔨 <@${userId}> ha sido baneado.` + (reason ? `\n**Razón:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `⚠️ <@${userId}> ha sido advertido.\n**Razón:** ${reason}`,
                unban: (userId: string) => `✅ \`${userId}\` ha sido desbaneado.`,
                forceban: (banned: number, total: number) => `🔨 Baneadas \`${banned}\`/\`${total}\` entradas de la blacklist.`,
                hackban: (userId: string, reason: string) => `🔨 \`${userId}\` ha sido baneado (hackban).\n**Razón:** ${reason}`,
                kick: (userId: string, reason: string) => `👢 <@${userId}> ha sido expulsado.\n**Razón:** ${reason}`,
                timeout: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> silenciado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`,
                untimeout: (userId: string) => `✅ Se ha quitado el silencio a <@${userId}>.`,
                unwarn: (userId: string, warnId: number | 'all') =>
                    `✅ Se han eliminado avisos de <@${userId}> (${warnId === 'all' ? 'todos' : `#${warnId}`}).`,
                clear: (amount: number, channelId: string) => `🧹 Borrados \`${amount}\` mensajes en <#${channelId}>.`,
                lock: (roleId: string, channelId: string) => `🔒 Bloqueado <#${channelId}> para <@&${roleId}>.`,
                unlock: (roleId: string, channelId: string) => `🔓 Desbloqueado <#${channelId}> para <@&${roleId}>.`,
                backupCreate: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `📦 Backup creado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                backupLoad: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `📦 Backup restaurado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`
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

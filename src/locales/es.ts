/**
 * Locale en español, servido vía `@LocalesT(...)` sobre la base en inglés que registra Discord (ver
 * CONTRIBUTING.md, sección "Idioma").
 *
 * Estructura en espejo del árbol de comandos: `commands.<categoria>.<comando>.<clave>`, más un
 * namespace `systems` para mensajes sin invocador directo (sistemas de protección, logs, automod).
 * Los textos dinámicos son funciones `(args) => string`; los fijos, literales planos. El texto
 * compartido entre comandos hermanos vive bajo una clave `shared` de esa categoría, no duplicado.
 */
import { EmojiKey, Emojis } from '../systems/emojis/index.js';

/** Shorthand for the emoji a message shows for a key, resolved when this file is imported. */
const emoji = (key: EmojiKey): string => Emojis.get(key);

export default {
    commands: {
        configuration: {
            ping: {
                name: 'ping',
                description: 'Muestra la latencia del bot.',
                calculating: 'Calculando...',
                latency: (message: number, api: number) =>
                    `${emoji(EmojiKey.MessageLatency)} Latencia del mensaje: \`${message}ms\`\n${emoji(EmojiKey.ApiLatency)} Latencia de la API: \`${api}ms\``,
                withDatabase: (message: number, api: number, database: number) =>
                    `${emoji(EmojiKey.MessageLatency)} Latencia del mensaje: \`${message}ms\`\n${emoji(EmojiKey.ApiLatency)} Latencia de la API: \`${api}ms\`\n${emoji(EmojiKey.DatabaseLatency)} Latencia de la base de datos: \`${database}ms\``
            },
            channel: {
                name: 'channel',
                description: 'Gestiona los canales de tu servidor.',
                usage: 'Usa `/channel create` o `/channel delete`.',
                created: `${emoji(EmojiKey.Success)} Canal creado.`,
                deleted: `${emoji(EmojiKey.Success)} Canal eliminado.`,
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
                    done: `${emoji(EmojiKey.Success)} Nombre del servidor actualizado.`
                },
                setIcon: {
                    name: 'set-icon',
                    description: 'Cambia el icono del servidor.',
                    option: { url: { name: 'url', description: 'Enlace a la nueva imagen del icono.' } },
                    done: `${emoji(EmojiKey.Success)} Icono del servidor actualizado.`,
                    invalidUrl: `${emoji(EmojiKey.Error)} No se pudo descargar esa imagen.`
                },
                createInvite: {
                    name: 'create-invite',
                    description: 'Crea una invitación en un canal de texto al azar.',
                    done: (invite: string) => `${emoji(EmojiKey.Success)} Invitación creada: ${invite}`,
                    noChannel: `${emoji(EmojiKey.Error)} No hay ningún canal de texto disponible.`
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
                    done: `${emoji(EmojiKey.Success)} Apodo actualizado.`
                },
                addRole: {
                    name: 'add-role',
                    description: 'Añade un rol a un miembro.',
                    done: `${emoji(EmojiKey.Success)} Rol añadido.`
                },
                removeRole: {
                    name: 'remove-role',
                    description: 'Quita un rol a un miembro.',
                    done: `${emoji(EmojiKey.Success)} Rol quitado.`
                },
                role: {
                    option: {
                        member: { name: 'miembro', description: 'Miembro a editar.' },
                        role: { name: 'rol', description: 'Rol a añadir/quitar.' }
                    },
                    hierarchyError: `${emoji(EmojiKey.Error)} No puedes gestionar un rol igual o superior al tuyo.`
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
                done: (removed: number) => `${emoji(EmojiKey.Success)} Hecho. Se han eliminado \`${removed}\` entradas.`,
                nothing: 'ℹ️ No hay nada que eliminar.',
                confirmLabel: 'Sí, continuar',
                cancelLabel: 'Cancelar',
                channels: {
                    name: 'channels',
                    description: 'Elimina canales duplicados por nombre.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} Se eliminarán \`${count}\` canales cuyo nombre coincide con el de otro anterior: ${list}.\nSi alguno estaba duplicado a propósito, también se borrará y no se puede deshacer. ¿Seguro?`
                },
                roles: {
                    name: 'roles',
                    description: 'Elimina roles duplicados por nombre.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} Se eliminarán \`${count}\` roles cuyo nombre coincide con el de otro anterior: ${list}.\nSi alguno estaba duplicado a propósito, también se borrará y no se puede deshacer. ¿Seguro?`
                },
                emojis: {
                    name: 'emojis',
                    description: 'Elimina emojis duplicados por nombre.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} Se eliminarán \`${count}\` emojis cuyo nombre coincide con el de otro anterior: ${list}.\nSi alguno estaba duplicado a propósito, también se borrará y no se puede deshacer. ¿Seguro?`
                },
                bans: {
                    name: 'bans',
                    description: 'Desbanea a todos los usuarios baneados actualmente.',
                    confirm: (count: number, list: string) =>
                        `${emoji(EmojiKey.Warning)} Se desbanearán \`${count}\` usuarios: ${list}.\nSe levantan todos los baneos, no solo los de un raid. ¿Seguro?`
                }
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
                done: (amount: number) => `${emoji(EmojiKey.Success)} Se han borrado \`${amount}\` mensajes.`
            },
            nuke: {
                name: 'nuke',
                description: 'Borra y recrea este canal, eliminando todos sus mensajes.',
                notText: `${emoji(EmojiKey.Error)} Esto solo se puede usar en canales de texto.`,
                confirm: `${emoji(EmojiKey.Warning)} Esto borrará **todos** los mensajes de este canal y no se puede deshacer. ¿Seguro?`,
                confirmLabel: 'Sí, borrar todo',
                cancelLabel: 'Cancelar',
                done: `${emoji(EmojiKey.Success)} Canal reiniciado.`
            },
            shared: {
                cannotTargetBot: `${emoji(EmojiKey.Error)} No puedo hacer eso conmigo mismo.`,
                cannotTargetSelf: `${emoji(EmojiKey.Error)} No puedes hacerte eso a ti mismo.`,
                hierarchyError: `${emoji(EmojiKey.Error)} No puedes moderar a alguien con un rol igual o superior al tuyo.`,
                defaultReason: 'No se especificó ninguna razón.',
                dm: (guildName: string, reason: string) => `Has recibido una acción de moderación en \`${guildName}\`.\n**Razón:** ${reason}`,
                forceReasonRequired: (allowed: string[]) =>
                    `${emoji(EmojiKey.Error)} Este servidor exige una de sus razones predefinidas: ${allowed.map((reason) => `\`${reason}\``).join(', ')}.`
            },
            ban: {
                name: 'ban',
                description: 'Banea a un miembro de tu servidor.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a banear.' },
                    reason: { name: 'razon', description: 'Razón del baneo.' }
                },
                done: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} <@${userId}> ha sido baneado.\n**Razón:** ${reason}`
            },
            kick: {
                name: 'kick',
                description: 'Expulsa a un miembro de tu servidor.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a expulsar.' },
                    reason: { name: 'razon', description: 'Razón de la expulsión.' }
                },
                notAMember: `${emoji(EmojiKey.Error)} Ese usuario no es miembro de este servidor.`,
                done: (userId: string, reason: string) => `👢 <@${userId}> ha sido expulsado.\n**Razón:** ${reason}`
            },
            hackban: {
                name: 'hackban',
                description: 'Banea a un usuario que no es miembro de tu servidor, por id.',
                option: {
                    id: { name: 'id', description: 'ID del usuario a banear — no hace falta que sea miembro de este servidor.' },
                    reason: { name: 'razon', description: 'Razón del baneo.' }
                },
                invalidId: `${emoji(EmojiKey.Error)} Eso no es una id válida.`,
                failed: `${emoji(EmojiKey.Error)} No he podido banear a ese usuario.`,
                done: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` ha sido baneado.\n**Razón:** ${reason}`
            },
            timeout: {
                name: 'timeout',
                description: 'Aislamiento nativo de Discord — silencia a un miembro durante un tiempo.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a aislar.' },
                    minutes: { name: 'minutos', description: 'Duración en minutos (10-40320, el límite de Discord son 28 días).' },
                    reason: { name: 'razon', description: 'Razón del aislamiento.' }
                },
                notAMember: `${emoji(EmojiKey.Error)} Ese usuario no es miembro de este servidor.`,
                failed: `${emoji(EmojiKey.Error)} No he podido aislar a ese usuario.`,
                done: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> ha sido aislado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`
            },
            detect: {
                name: 'detect',
                description: 'Escanea los miembros de tu servidor contra la blacklist de UBFB.',
                scanning: '🔎 Escaneando miembros, esto puede tardar un poco...',
                noneFound: `${emoji(EmojiKey.Success)} No se ha encontrado ningún usuario malicioso.`,
                found: (count: number, guildName: string) => `🚫 Se han encontrado \`${count}\` usuarios maliciosos en \`${guildName}\`:`,
                entry: (userId: string, reason: string) => `<@${userId}> — Razón: \`${reason}\``,
                entryUnknownReason: (userId: string) => `<@${userId}> — Razón desconocida`
            },
            forceban: {
                name: 'forceban',
                description: 'Banea a todos los de la blacklist de UBFB de tu servidor, sean miembros o no.',
                option: { reason: { name: 'razon', description: 'Solo banea entradas de la blacklist con esta razón. Por defecto, todas.' } },
                noneMatching: `${emoji(EmojiKey.Error)} No hay ninguna entrada de la blacklist que coincida.`,
                confirm: (count: number) => `${emoji(EmojiKey.Warning)} Esto baneará a \`${count}\` usuarios de la blacklist de UBFB. ¿Seguro?`,
                confirmLabel: 'Sí, banear a todos',
                cancelLabel: 'Cancelar',
                done: (banned: number, total: number) => `${emoji(EmojiKey.Success)} Baneados \`${banned}\`/\`${total}\` usuarios.`
            },
            sos: {
                name: 'sos',
                description: 'Avisa al staff de SPAgency con una invitación nueva a este servidor. Para emergencias.',
                noStaffChannel: `${emoji(EmojiKey.Error)} El canal de alertas del staff no está configurado — contacta directamente con el soporte de SPAgency.`,
                noChannel: `${emoji(EmojiKey.Error)} No hay ningún canal de texto disponible para crear la invitación.`,
                done: `${emoji(EmojiKey.Success)} Aviso enviado.`
            },
            baninfo: {
                name: 'baninfo',
                description: "Muestra los detalles de un baneo del servidor.",
                option: { user: { name: 'usuario', description: 'Usuario a consultar.' } },
                notBanned: `${emoji(EmojiKey.Error)} Ese usuario no está baneado.`,
                noReason: 'Sin razón especificada',
                info: (username: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${username}\` está baneado.\n**Razón:** ${reason}`
            },
            unban: {
                name: 'unban',
                description: 'Desbanea a un usuario de tu servidor.',
                option: { id: { name: 'id', description: 'ID del usuario a desbanear.' } },
                invalidId: `${emoji(EmojiKey.Error)} Eso no es una id válida.`,
                notBanned: `${emoji(EmojiKey.Error)} Ese usuario no está baneado.`,
                done: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` ha sido desbaneado.`
            },
            untimeout: {
                name: 'untimeout',
                description: 'Elimina el aislamiento de un miembro.',
                option: { member: { name: 'miembro', description: 'Miembro al que quitar el aislamiento.' } },
                notAMember: `${emoji(EmojiKey.Error)} Ese usuario no es miembro de este servidor.`,
                failed: `${emoji(EmojiKey.Error)} No he podido quitarle el aislamiento a ese usuario.`,
                done: (userId: string) => `${emoji(EmojiKey.Success)} Se ha eliminado el aislamiento de <@${userId}>.`
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
                    `${emoji(EmojiKey.Ban)} <@${userId}> baneado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`
            },
            warn: {
                name: 'warn',
                description: 'Añade un aviso a un miembro.',
                option: {
                    member: { name: 'miembro', description: 'Miembro a avisar.' },
                    reason: { name: 'razon', description: 'Razón del aviso.' }
                },
                done: (userId: string, total: number, reason: string) =>
                    `${emoji(EmojiKey.Warning)} <@${userId}> avisado (\`${total}\` en total).\n**Razón:** ${reason}`
            },
            warns: {
                name: 'warns',
                description: 'Lista los avisos de un miembro.',
                option: { member: { name: 'miembro', description: 'Miembro a consultar.' } },
                none: `${emoji(EmojiKey.Success)} Ese usuario no tiene avisos.`,
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
                needsIdOrAll: `${emoji(EmojiKey.Error)} Especifica \`id\` o pon \`todos\` en \`true\`.`,
                notFound: `${emoji(EmojiKey.Error)} No existe ningún aviso con esa id para ese usuario.`,
                done: (userId: string, id: number) => `${emoji(EmojiKey.Success)} Eliminado el aviso \`#${id}\` de <@${userId}>.`,
                doneAll: (userId: string, total: number) => `${emoji(EmojiKey.Success)} Eliminados \`${total}\` avisos de <@${userId}>.`
            },
            backup: {
                name: 'backup',
                description: 'Guarda y restaura una copia de este servidor (canales, roles, baneos, emojis, stickers).',
                usage: 'Usa `/backup create`, `/backup info`, `/backup load`, o `/backup delete`.',
                none: `${emoji(EmojiKey.Error)} Este servidor no tiene ningún backup guardado.`,
                deleted: `${emoji(EmojiKey.Success)} Backup eliminado.`,
                overwritePrompt: `${emoji(EmojiKey.Warning)} Esto reemplazará el backup existente — el anterior se perderá. ¿Estás seguro?`,
                overwriteYes: 'Sí, sobrescribirlo',
                overwriteNo: 'Cancelar',
                deletePrompt: `${emoji(EmojiKey.Warning)} Esto eliminará permanentemente el backup de este servidor. ¿Estás seguro?`,
                deleteYes: 'Sí, eliminarlo',
                deleteNo: 'Cancelar',
                creating: '⏳ Creando backup, esto puede tardar un momento...',
                created: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Success)} Backup creado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                details: (name: string, channels: number, roles: number, bans: number, emojis: number, stickers: number, createdAt: Date) =>
                    `${emoji(EmojiKey.Backup)} Backup de \`${name}\`, tomado <t:${Math.floor(createdAt.getTime() / 1000)}:R>.\n\`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                cleanupPrompt: `${emoji(EmojiKey.Warning)} ¿Limpiar canales/roles duplicados (de un raid) antes de restaurar?`,
                cleanupYes: 'Sí, limpiar primero',
                cleanupNo: 'No, solo restaurar',
                restoring: '⏳ Restaurando, esto puede tardar un momento...',
                restored: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Success)} Restaurados \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis y \`${stickers}\` stickers que faltaban.`,
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
                notFound: (name: string) => `${emoji(EmojiKey.Error)} No existe ningún comando llamado \`${name}\`.`,
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
                clean: (userId: string) => `${emoji(EmojiKey.Success)} <@${userId}> no está en la blacklist de UBFB.`,
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
                success: `${emoji(EmojiKey.Success)} Reporte enviado. El equipo de UBFB lo revisará.`,
                alreadyPending: `${emoji(EmojiKey.Error)} Ese usuario ya tiene un reporte pendiente de revisión.`,
                invalidProof: `${emoji(EmojiKey.Error)} El enlace de la prueba no es válido, debe ser una imagen.`
            },
            cache: {
                name: 'cache',
                description: 'Inspecciona/calienta/invalida la entrada de GuildConfigCache de un servidor.',
                usage: 'Usa `/cache info`, `/cache hit`, o `/cache reload`.',
                noGuild: `${emoji(EmojiKey.Error)} No diste un id de servidor, y esto no se ejecutó en un servidor.`,
                notCached: (guildId: string) => `${emoji(EmojiKey.Error)} No hay nada cacheado para \`${guildId}\` ahora mismo.`,
                noRow: (guildId: string) => `${emoji(EmojiKey.Error)} \`${guildId}\` no tiene ninguna fila en la base de datos.`,
                hitResult: (ms: string) => `⏱️ Round-trip del fallo de caché: \`${ms}ms\`.`,
                reloaded: (guildId: string) => `${emoji(EmojiKey.Success)} Recargada la entrada de caché de \`${guildId}\`.`,
                option: {
                    guildId: {
                        name: 'guild_id',
                        description: 'Id del servidor a comprobar — por defecto, el servidor actual.'
                    }
                },
                info: {
                    name: 'info',
                    description: 'Muestra qué hay cacheado ahora mismo para un servidor, sin tocar la base de datos.'
                },
                hit: {
                    name: 'hit',
                    description: 'Fuerza un fallo de caché para un servidor y reporta cuánto tardó en recargarse.'
                },
                reload: {
                    name: 'reload',
                    description: 'Fuerza la invalidación y recarga de la entrada de caché de un servidor.'
                }
            }
        }
    },
    systems: {
        antiraid: {
            banReason: 'Raid detectado.'
        },
        antibots: {
            kickReason: 'Los bots no pueden unirse a este servidor.'
        },
        maliciousMember: {
            ownerDmMark: (userId: string, reason: string) =>
                `${emoji(EmojiKey.Warning)} Un usuario malicioso conocido (<@${userId}>) se ha unido a tu servidor. Le he cambiado el apodo a \`${reason}\` para marcarlo.`,
            ownerDmBan: (userId: string, reason: string) =>
                `${emoji(EmojiKey.Warning)} Un usuario malicioso conocido (<@${userId}>) se ha unido a tu servidor. Lo he baneado.\n**Razón:** ${reason}`
        },
        raidmode: {
            joinBanReason: 'Raidmode está activo — no se permiten entradas ahora mismo.',
            actionBanReason: 'Raidmode está activo — no se permiten cambios de canales/roles/baneos ahora mismo.'
        },
        raidBotAdder: {
            banReason: (botId: string) => `Añadió un bot (\`${botId}\`) que fue baneado por raider.`
        },
        selfbot: {
            actionReason: 'Esta cuenta fue marcada como probable selfbot/cuenta falsa al unirse.'
        },
        intelligentSos: {
            alert: (guildName: string, guildId: string, invite: string) => `@everyone 🆘 **S.O.S.** de \`${guildName}\` (${guildId})!\n${invite}`,
            automaticAlert: (guildName: string, guildId: string, invite: string, reason: string) =>
                `@everyone 🆘 **S.O.S. automático** de \`${guildName}\` (${guildId})!\n**Motivo:** ${reason}\n${invite}`
        },
        support: {
            opening: {
                title: (subject: string) => `🎫 ${subject}`,
                description: (userId: string, username: string) =>
                    `Ticket abierto desde la web por <@${userId}> (**${username}**, \`${userId}\`).\nEl staff responde escribiendo en este canal. Los mensajes que empiezan por \`//\` son notas internas: no llegan al usuario.`,
                closeButton: 'Cerrar ticket'
            },
            message: {
                attachment: '[archivo adjunto no disponible en la web]',
                unknownUser: 'usuario',
                unknownRole: 'rol',
                unknownChannel: 'canal'
            },
            close: {
                notice: {
                    user: '🔒 Ticket cerrado por el usuario desde la web.',
                    staff: (staffId: string) => `🔒 Ticket cerrado por <@${staffId}>.`
                },
                button: {
                    notStaff: `${emoji(EmojiKey.Error)} Solo el staff puede cerrar tickets.`,
                    notTicket: `${emoji(EmojiKey.Error)} Este canal no es un ticket.`,
                    started: '🔒 Cerrando el ticket…',
                    already: 'ℹ️ Este ticket ya se está cerrando.',
                    failed: `${emoji(EmojiKey.Error)} No se pudo iniciar el cierre. Inténtalo de nuevo.`
                },
                truncated: (omitted: number) => `${emoji(EmojiKey.Warning)} La web solo recibió los últimos mensajes: los ${omitted} más antiguos no caben en su límite de tamaño. Están en la copia adjunta.`,
                dm: (subject: string) => `🔒 Tu ticket «${subject}» se ha cerrado. Puedes consultar la conversación desde la web, en tu historial de soporte.`,
                staffCopy: (subject: string, userId: string, by: string) => `${emoji(EmojiKey.Attachment)} Ticket **${subject}** de <@${userId}> cerrado ${by}. Copia con las notas internas adjunta.`,
                deliveryFailed: (subject: string, channelId: string, reason: string) =>
                    `${emoji(EmojiKey.Warning)} No se pudo entregar a la web el transcript del ticket **${subject}** (<#${channelId}>): ${reason}. El canal queda bloqueado y sin borrar; se reintentará al reiniciar el bot. Copia adjunta.`
            },
            transcript: {
                header: (subject: string, ticketId: string, userId: string, openedAt: string, closedAt: string, by: string) =>
                    `Ticket: ${subject}\nID: ${ticketId}\nUsuario: ${userId}\nAbierto: ${openedAt}\nCerrado: ${closedAt} (${by})`,
                staffTruncated: (omitted: number) => `[… ${omitted} mensajes anteriores omitidos por tamaño …]`,
                closedByUser: 'por el usuario',
                closedByStaff: 'por el staff',
                authors: {
                    user: 'usuario',
                    staff: 'staff',
                    note: 'nota interna'
                }
            }
        },
        verification: {
            dm: (link: string) => `${emoji(EmojiKey.Welcome)} ¡Bienvenido! Para acceder a este servidor, verifícate aquí:\n${link}\n\nEste enlace caduca en 15 minutos.`
        },
        automod: {
            reason: {
                flood: () => 'Enviar mensajes demasiado rápido.',
                ghostping: () => 'Mencionar a alguien y borrar el mensaje poco después.',
                capsLock: () => 'Uso excesivo de mayúsculas.',
                manyEmojis: () => 'Demasiados emojis en un mensaje.',
                manyWords: () => 'Mensaje demasiado largo.',
                nativeAutomod: () => 'Marcado por las reglas propias de AutoMod de Discord del servidor.'
            },
            announce: {
                ghostping: (userId: string, mentionedUserId?: string) =>
                    mentionedUserId
                        ? `🕵️ <@${userId}> mencionó a <@${mentionedUserId}> y borró el mensaje poco después.`
                        : `🕵️ <@${userId}> mencionó a alguien y borró el mensaje poco después.`,
                capsLock: (userId: string) => `🔠 <@${userId}>, baja el tono con las mayúsculas.`,
                manyEmojis: (userId: string) => `🙂 <@${userId}>, son demasiados emojis para un mensaje.`,
                manyWords: (userId: string) => `📝 <@${userId}>, ese mensaje era demasiado largo.`
            },
            webhookFloodReason: () => 'Flood de webhooks.'
        },
        cooldown: {
            blocked: (seconds: number) => `${emoji(EmojiKey.Error)} Espera un poco — inténtalo de nuevo en \`${seconds}s\`.`
        },
        logs: {
            events: {
                channelCreate: (channelId: string) => `📁 Se ha creado un canal: <#${channelId}>.`,
                channelDelete: (channelId: string) => `🗑️ Se ha eliminado un canal: \`${channelId}\`.`,
                channelUpdate: (channelId: string) => `✏️ Se ha editado un canal: <#${channelId}>.`,
                roleCreate: (roleId: string) => `${emoji(EmojiKey.Success)} Se ha creado un rol: <@&${roleId}>.`,
                roleDelete: (roleId: string) => `🗑️ Se ha eliminado un rol: \`${roleId}\`.`,
                webhookCreate: () => '🪝 Se ha creado un webhook.',
                ban: (userId: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` ha sido baneado.`,
                unban: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` ha sido desbaneado.`,
                raidDetected: (userId: string) => `${emoji(EmojiKey.Raid)} Raid detectado — se ha baneado a <@${userId}>.`,
                antibotsKick: (userId: string) => `🤖 <@${userId}> fue expulsado — no se permite la entrada de bots.`,
                antiraidDisabled: () =>
                    `${emoji(EmojiKey.Warning)} El antiraid se ha desactivado automáticamente: ya no tengo Banear Miembros/Ver Auditoría, o hay otro rol por encima del mío. Corrígelo y vuelve a activarlo.`,
                logsDisabled: () => `${emoji(EmojiKey.Warning)} El canal de logs se ha desactivado tras un fallo de envío. Configura uno nuevo para reactivarlos.`,
                maliciousMemberNone: (userId: string) => `👁️ Un usuario malicioso conocido (<@${userId}>) se ha unido — sin ninguna acción.`,
                maliciousMemberMark: (userId: string) => `🚩 Un usuario malicioso conocido (<@${userId}>) se ha unido — apodo cambiado para marcarlo.`,
                maliciousMemberBan: (userId: string) => `${emoji(EmojiKey.Ban)} Un usuario malicioso conocido (<@${userId}>) se ha unido — baneado.`,
                raidmodeJoinBan: (userId: string) => `🔒 <@${userId}> se unió durante el raidmode — baneo temporal.`,
                raidmodeActionBan: (userId: string) => `🔒 <@${userId}> hizo un cambio durante el raidmode — baneado.`,
                raidmodeExpired: () => '🔓 El raidmode expiró y se desactivó automáticamente.',
                selfbotKick: (userId: string) => `🕵️ <@${userId}> fue marcado como probable selfbot/cuenta falsa — expulsado.`,
                selfbotBan: (userId: string) => `🕵️ <@${userId}> fue marcado como probable selfbot/cuenta falsa — baneado.`,
                automodViolation: (userId: string, detector: string, sanction: string) =>
                    `${emoji(EmojiKey.Warning)} <@${userId}> saltó el automod (\`${detector}\`) — \`${sanction}\`.`,
                webhookFloodPurge: (webhookId: string) => `🪝 Eliminado el webhook \`${webhookId}\` por flood.`,
                raidBotAdderBan: (userId: string, botId: string) => `${emoji(EmojiKey.Ban)} <@${userId}> añadió a \`${botId}\`, baneado por raider — también baneado.`
            },
            actions: {
                ban: (userId: string, reason?: string) =>
                    `${emoji(EmojiKey.Ban)} <@${userId}> ha sido baneado.` + (reason ? `\n**Razón:** ${reason}` : ''),
                warn: (userId: string, reason: string) => `${emoji(EmojiKey.Warning)} <@${userId}> ha sido advertido.\n**Razón:** ${reason}`,
                unban: (userId: string) => `${emoji(EmojiKey.Success)} \`${userId}\` ha sido desbaneado.`,
                forceban: (banned: number, total: number) => `${emoji(EmojiKey.Ban)} Baneadas \`${banned}\`/\`${total}\` entradas de la blacklist.`,
                hackban: (userId: string, reason: string) => `${emoji(EmojiKey.Ban)} \`${userId}\` ha sido baneado (hackban).\n**Razón:** ${reason}`,
                kick: (userId: string, reason: string) => `👢 <@${userId}> ha sido expulsado.\n**Razón:** ${reason}`,
                timeout: (userId: string, minutes: number, reason: string) =>
                    `🔇 <@${userId}> silenciado durante \`${minutes}\` minutos.\n**Razón:** ${reason}`,
                untimeout: (userId: string) => `${emoji(EmojiKey.Success)} Se ha quitado el silencio a <@${userId}>.`,
                unwarn: (userId: string, warnId: number | 'all') =>
                    `${emoji(EmojiKey.Success)} Se han eliminado avisos de <@${userId}> (${warnId === 'all' ? 'todos' : `#${warnId}`}).`,
                clear: (amount: number, channelId: string) => `🧹 Borrados \`${amount}\` mensajes en <#${channelId}>.`,
                lock: (roleId: string, channelId: string) => `🔒 Bloqueado <#${channelId}> para <@&${roleId}>.`,
                unlock: (roleId: string, channelId: string) => `🔓 Desbloqueado <#${channelId}> para <@&${roleId}>.`,
                backupCreate: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Backup)} Backup creado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                backupLoad: (channels: number, roles: number, bans: number, emojis: number, stickers: number) =>
                    `${emoji(EmojiKey.Backup)} Backup restaurado: \`${channels}\` canales, \`${roles}\` roles, \`${bans}\` baneos, \`${emojis}\` emojis, \`${stickers}\` stickers.`,
                tempban: (userId: string, minutes: number, reason: string) =>
                    `${emoji(EmojiKey.Ban)} <@${userId}> baneado temporalmente durante \`${minutes}\` minutos.\n**Razón:** ${reason}`,
                nuke: (channelId: string) => `💥 El canal <#${channelId}> fue nukeado (borrado y recreado).`,
                backupDelete: () => '🗑️ Se ha eliminado el backup de este servidor.',
                channelCreate: (channelId: string) => `${emoji(EmojiKey.Success)} Se ha creado el canal <#${channelId}>.`,
                channelDelete: (channelId: string) => `🗑️ Se ha eliminado el canal \`${channelId}\`.`,
                createInvite: (channelId: string, code: string) => `${emoji(EmojiKey.Success)} Invitación \`${code}\` creada para <#${channelId}>.`,
                setIcon: () => `${emoji(EmojiKey.Success)} Se ha cambiado el icono de este servidor.`,
                setName: (name: string) => `${emoji(EmojiKey.Success)} Se ha cambiado el nombre de este servidor a \`${name}\`.`,
                addRole: (userId: string, roleId: string) => `${emoji(EmojiKey.Success)} Añadido <@&${roleId}> a <@${userId}>.`,
                removeRole: (userId: string, roleId: string) => `${emoji(EmojiKey.Success)} Quitado <@&${roleId}> a <@${userId}>.`,
                setNickname: (userId: string, nickname: string) => `${emoji(EmojiKey.Success)} Apodo de <@${userId}> cambiado a \`${nickname}\`.`,
                unnukeBans: (removed: number) => `🧹 Unnuke: eliminados \`${removed}\` baneos.`,
                unnukeChannels: (removed: number) => `🧹 Unnuke: eliminados \`${removed}\` canales duplicados.`,
                unnukeRoles: (removed: number) => `🧹 Unnuke: eliminados \`${removed}\` roles duplicados.`,
                unnukeEmojis: (removed: number) => `🧹 Unnuke: eliminados \`${removed}\` emojis duplicados.`
            }
        },
        commands: {
            optionsError: (options: string) => `${emoji(EmojiKey.Error)} Revisa lo que has escrito, algo no es válido: \`${options}\`.`,
            permissionsFail: (permissions: string) => `${emoji(EmojiKey.Error)} Te faltan permisos para usar esto: \`${permissions}\`.`,
            botPermissionsFail: (permissions: string) => `${emoji(EmojiKey.Error)} Me faltan permisos para hacer esto: \`${permissions}\`.`,
            middlewaresError: (reason: string) => `${emoji(EmojiKey.Error)} ${reason}`,
            runError: `${emoji(EmojiKey.Error)} Ha ocurrido un error al ejecutar el comando.`,
            ownerOnly: 'Solo el propietario del servidor puede usar este comando.'
        }
    }
};

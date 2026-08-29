# Antiraid — filosofía y sistemas

Este documento explica cómo está pensado el conjunto de sistemas antiraid de SP Agency y cómo funciona cada uno **de los que ya existen** en `src/`. No cubre lo que todavía no está construido (antibots, antijoins, verification, raidmode, etc. — ver `guild_protection` en el schema para la lista completa de lo pendiente).

## Filosofía

Un raid se gana o se pierde en segundos. El diseño parte de tres ideas, en este orden de prioridad:

1. **Detectar y frenar sin depender de la red.** El camino caliente (cada evento del audit log) no debe esperar a ninguna consulta HTTP ni a la base de datos salvo un `Map` en memoria. Una petición a Discord o a Postgres en medio de una ráfaga de 50 eventos por segundo es tiempo que el bot no tiene.
2. **Frenar automáticamente, sin intervención humana.** Nadie está mirando el servidor a las 4 de la mañana. El sistema banea por sí solo cuando detecta el patrón, no se limita a avisar.
3. **Poder deshacer el daño después.** Ninguna detección es perfecta. Si algo pasa, hay herramientas para revertirlo (`/unnuke`, `/backup`) en vez de depender de que la detección nunca falle.

Todo lo que sigue es la implementación de estas tres ideas.

## 1. Detección de ráfagas — `AntiraidSystem` + `BurstTracker`

**Ficheros:** [`src/systems/antiraid/AntiraidSystem.ts`](../src/systems/antiraid/AntiraidSystem.ts), [`BurstTracker.ts`](../src/systems/antiraid/BurstTracker.ts)

La idea de un raid no es "una acción sospechosa", es "muchas acciones sospechosas seguidas". `BurstTracker` es un contador de ráfaga genérico (no sabe nada de antiraid, podría usarse para cualquier otra cosa): cada `hit()` con la misma `key` suma uno a un contador en memoria con un `setTimeout` que lo resetea si no llegan más hits a tiempo. Si el contador llega al `threshold` dentro de `windowMs`, devuelve `true` una única vez y se resetea.

`AntiraidSystem.detect()` usa un único contador **por servidor** (no por tipo de acción) con `threshold = 3` y `windowMs = 10_000`. Esto es deliberado: un raid que mezcla creación de canales y borrado de roles debe seguir contando como una sola ráfaga, no dos ráfagas de 1-2 hits que nunca llegan al umbral por separado.

No todos los hits valen lo mismo. `BurstTracker.hit()` acepta un `weight` (por defecto 1), y `AntiraidSystem.weightFor()` decide cuánto vale una entrada concreta del audit log antes de pasarla a `detect()`: si se crea un canal con el **mismo nombre que uno ya existente** (comprobado contra la caché de canales, sin red — los raiders suelen clonar/duplicar nombres al hacer spam), cuenta doble en vez de uno, así que la ráfaga salta antes. Un falso positivo aquí (un admin que de verdad nombra dos canales igual) es mucho más barato que dejar pasar un raid real.

El efecto está acotado a propósito: duplicar el peso solo adelanta *cuándo* salta el umbral (en el peor caso, de 3 acciones normales a 2 si una es un nombre duplicado), no lo baja para todo lo demás. El único falso positivo realista es un admin creando dos canales con el mismo nombre a propósito (archivar y reemplazar, por ejemplo) mientras ya había otra acción de por medio — raro, y mucho más barato que dejar pasar un raid real.

Antes de contar nada, dos guards baratos cortan el camino:
- Si el que ejecutó la acción es **el propio bot** (`executorId === client.botId`), se ignora. Sin este guard, restaurar un backup con varios canales seguidos haría que el bot intentase banearse a sí mismo.
- Si las `antiraidEnable`/`whitelist` del servidor (vía caché, ver más abajo) descartan la acción, tampoco se cuenta.

Cuando la ráfaga salta, se banea a quien la causó y se registra un `ServerEventLog` de tipo `RaidDetected` (ver sección 4).

## 2. Config sin red — `GuildConfigCache`

**Fichero:** [`src/systems/antiraid/GuildConfigCache.ts`](../src/systems/antiraid/GuildConfigCache.ts)

Comprobar `antiraidEnable`/`whitelist` en cada evento del audit log no puede significar una consulta a Postgres por evento — eso rompe la idea 1 de la filosofía. `GuildConfigCache` mantiene un `Map<guildId, AntiraidSettings>` en memoria, con la consulta más barata posible en caso de fallo de caché (`GuildRepository.getAntiraidSettings`, sin joins de más).

Lo interesante no es la caché en sí, es cómo se invalida: en vez de que el bot tenga que acordarse de borrar la entrada cada vez que él mismo cambia la config (y fallar en cuanto otra pieza del sistema — o mañana, la dashboard web — toque la misma fila sin pasar por ese código), la invalidación vive **en Postgres**. Las tablas `guild_protection` y `guild_configuration` tienen un trigger que hace `pg_notify('guild_config_changed', guild_id)` en cualquier `UPDATE`, sin importar qué proceso hizo el cambio. El bot simplemente hace `LISTEN` sobre ese canal y borra la entrada correspondiente del `Map` cuando le llega el aviso.

Esto significa que **la futura dashboard no necesita avisar al bot de nada** — un `UPDATE` normal ya invalida la caché sola. Como red de seguridad ante un aviso perdido (reconexión del `LISTEN`, etc.), hay además un `setInterval` que vacía toda la caché cada 10 minutos.

## 3. Un único punto de entrada — `guildAuditLogEntryCreate`

**Fichero:** [`src/events/guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts)

Seyfert solo permite **un** handler por nombre de evento — un segundo `createEvent({ data: { name: 'guildAuditLogEntryCreate' } })` en otro fichero no se sumaría al primero, lo **reemplazaría** en silencio. Por eso todo lo que dependa del audit log (antiraid y cualquier logging futuro) vive en este único fichero, documentado explícitamente para que nadie intente separarlo.

Esto sustituye por completo al enfoque legacy de hacer polling del audit log vía REST tras cada evento de canal/rol/ban — `guildAuditLogEntryCreate` es un evento real del gateway, así que el `executorId` llega directo en el payload sin ninguna petición HTTP de por medio.

El handler hace dos cosas, en este orden:
1. Si la acción es una de las que le importan al detector de ráfagas (`ChannelCreate/Delete/Update`, `RoleCreate/Delete`, `MemberBanAdd/Remove`), llama a `AntiraidSystem.detect()`.
2. Si el ejecutor no es el propio bot, intenta traducir la acción a un `ServerEventLog` (sección 4) y lo despacha.

El orden importa: el chequeo de antiraid va primero (o en paralelo) para que nunca lo retrase lo que se añada después en este mismo handler.

## 4. Logging — `BotActionLog` vs `ServerEventLog`

Cada detección y cada ban genera su correspondiente log (`RaidDetected` en `ServerEventLog`, el propio ban en su `BotActionLog` si viene de un comando). Cómo funcionan esos dos sistemas y por qué no se duplican entre sí está explicado aparte, en [`logs.md`](logs.md) — es un sistema transversal, no específico del antiraid.

## 5. Recuperación — `/unnuke` y `/backup`

**Ficheros:** [`src/commands/configuration/unnuke/`](../src/commands/configuration/unnuke/), [`src/systems/backup/BackupSystem.ts`](../src/systems/backup/BackupSystem.ts)

La detección puede fallar (raid coordinado con cuentas nuevas, gente actuando más despacio que el `threshold`, etc.), así que hace falta poder deshacer el daño manualmente:

- **`/unnuke bans|channels|roles|emojis`**: deshace cada tipo de destrozo por separado. `bans` desbanea a todo el mundo (deshace un ban masivo), los demás borran duplicados creados por spam usando `UnnukeHelpers.deleteDuplicates` (compara por nombre, borra todo menos la primera aparición). Cada subcomando tiene su propio cooldown (`@Cooldown.user`, grupo `unnuke` compartido entre los cuatro) para que no se puedan encadenar sin límite.
- **`/backup create|load|delete|info`**: snapshot completo del servidor (canales, roles, bans, emojis, stickers) que se puede restaurar entero si el raid fue tan grave que `/unnuke` no basta. Las descargas de imágenes (emojis/stickers) se hacen secuencialmente, no en paralelo, para no disparar ráfagas de peticiones al CDN de Discord durante la propia restauración.

Ambos flujos generan su `BotActionLog` correspondiente (`UnnukeBans`, `BackupLoad`, etc.) y ambos pasan por `Confirmation.ask()` antes de ejecutar nada, por ser acciones destructivas o difíciles de revertir.

## 6. Prerrequisitos para activarlo (diseñado, sin implementar)

Un `antiraidEnable: true` en la base de datos no sirve de nada si el bot no puede actuar de verdad. Antes de dejar activar el sistema (desde la futura dashboard, o desde cualquier otro sitio) hace falta comprobar que se cumplen, sin excepción:

- El bot tiene el permiso **Ban Members** — sin él, `client.bans.create()` en `AntiraidSystem.detect()` falla siempre.
- El bot tiene el permiso **View Audit Log** — sin él, Discord ni siquiera dispara el evento de gateway `guildAuditLogEntryCreate`, así que todo el sistema queda ciego, no solo el ban.
- El rol del bot ocupa la **posición más alta** de la jerarquía del servidor (no hace falta que esté marcado como "Mostrar rol por separado" — eso es cosmético, la jerarquía real de Discord depende solo de la posición). Sin esto, un atacante con un rol por encima del bot es literalmente imposible de banear vía API, permiso o no.

Si no se cumple **cualquiera** de los tres, no se puede activar. Nada de activarlo a medias ni de dejar que falle en silencio cuando llegue el raid.

**Dónde vive la comprobación — decisión clave:** no solo al activar el toggle. Los tres requisitos pueden dejar de cumplirse en cualquier momento después (alguien reordena roles, le quita un permiso al bot), y la config en base de datos no se enteraría sola. La validación tiene que ser continua y vivir **en el bot**, no en la dashboard:

- El bot ya tiene la posición del rol y sus propios permisos en caché de gateway (sincronizados vía `GUILD_CREATE`/`ROLE_UPDATE`/`GUILD_MEMBER_UPDATE`), así que comprobarlo no cuesta ninguna petición de red — sigue cumpliendo la regla de cero red en el hot path.
- Si en algún momento deja de cumplirse estando ya activado, el bot debe desactivarlo él mismo en la base de datos y avisar al dueño del servidor (DM o vía `STAFF_LOGS_CHANNEL`), en vez de dejarlo activado-pero-inerte.
- La dashboard **no decide** si el servidor cumple los requisitos — solo refleja lo que diga el bot (o hace la misma comprobación por su cuenta contra la API REST de Discord — roles + member del bot — sin depender de que el proceso del bot esté corriendo en ese instante). Es un espejo, no una segunda fuente de verdad.

## Lo que falta

Todo lo que sigue existe como columna en `guild_protection` pero no tiene ninguna implementación en Seyfert todavía: `antibots`, `antitokens`, `antijoins`, `markMalicious`, `warnEntry`, `kickMalicious`, `verification`, `cannotEnterTwice`, `purgeWebhooksAttacks`, `intelligentSOS`, `intelligentAntiflood`/`antiflood`, `bloqEntritiesByName`, `bloqNewCreatedUsers`, `raidmode`. La mayoría vive junta en el evento `guildMemberAdd` del bot legacy y está pendiente de una sesión de diseño propia, igual que tuvo `AntiraidSystem`.

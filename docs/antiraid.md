# Antiraid — filosofía y sistemas

Este documento explica cómo está pensado el sistema de detección de ráfagas de SP Agency y cómo funciona cada pieza que ya existe en `src/`. El antibots (kick de bots al unirse) es un sistema hermano — comparte la misma caché de config y el mismo patrón de logging, pero está documentado aparte en [`antibots.md`](antibots.md).

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

Cuando la ráfaga salta, se banea a quien la causó y se registra el log correspondiente con un `private static log(...)` propio de la clase, debajo de `detect()` — mismo patrón que usa `AntibotsSystem` (ver [`logs.md`](logs.md)).

## 2. Config sin red — `GuildConfigCache`

**Fichero:** [`src/systems/protection/GuildConfigCache.ts`](../src/systems/protection/GuildConfigCache.ts)

Comprobar `antiraidEnable`/`whitelist` en cada evento del audit log no puede significar una consulta a Postgres por evento — eso rompe la idea 1 de la filosofía. `GuildConfigCache` mantiene un `Map<guildId, GuildSettings>` en memoria, con la consulta más barata posible en caso de fallo de caché (`GuildRepository.getGuildSettings`, sin joins de más). Vive en `src/systems/protection/`, no en `src/systems/antiraid/`, porque ya la usan también el antibots y `AutomodSystem` (ver [`moderation.md`](moderation.md)) — es la caché compartida de toda la config que necesitan los sistemas de protección al unirse/audit log/mensaje, no algo específico del antiraid. Para inspeccionarla/forzar su recarga a mano, ver [`cache.md`](cache.md) (`/cache`, herramienta de depuración interna, nunca disponible en producción).

Lo interesante no es la caché en sí, es cómo se invalida: en vez de que el bot tenga que acordarse de borrar la entrada cada vez que él mismo cambia la config (y fallar en cuanto otra pieza del sistema — o mañana, la dashboard web — toque la misma fila sin pasar por ese código), la invalidación vive **en Postgres**. Las tablas `guild_protection` y `guild_configuration` tienen un trigger que hace `pg_notify('guild_config_changed', guild_id)` en cualquier `UPDATE`, sin importar qué proceso hizo el cambio. El bot simplemente hace `LISTEN` sobre ese canal y borra la entrada correspondiente del `Map` cuando le llega el aviso.

Esto significa que **la futura dashboard no necesita avisar al bot de nada** — un `UPDATE` normal ya invalida la caché sola. Como red de seguridad ante un aviso perdido (reconexión del `LISTEN`, etc.), hay además un `setInterval` que vacía toda la caché cada 10 minutos.

**Por qué esto no se mueve a Redis, ni aunque esté en la misma VPS:** `BurstTracker` y `GuildConfigCache` están en el camino de decisión de un ban — cada hit del audit log pasa por ellos antes de decidir si banea. Redis en `localhost` sigue siendo una petición de red (socket/loopback, serialización, esperar respuesta), aunque comparta máquina y RAM con el bot — sustituir un `Map` en proceso por Redis aquí sería reintroducir exactamente la latencia que la idea 1 de la filosofía existe para evitar. Esto no es una cuestión de memoria (un `Map` de este tamaño no pesa nada) ni de "está en la misma VPS entonces da igual" — es que el camino caliente de una decisión de seguridad no puede depender de una petición, esté a un milisegundo o a cien. Este `Map` se queda en proceso salvo que el bot deje de ser un único proceso (sharding real con estado compartido entre procesos) — y aun así, cada guild siempre lo procesa el mismo shard, así que ese escenario ni siquiera obligaría a compartir este `Map` en concreto.

## 3. Un único punto de entrada — `guildAuditLogEntryCreate`

**Fichero:** [`src/events/guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts)

Seyfert solo permite **un** handler por nombre de evento — un segundo `createEvent({ data: { name: 'guildAuditLogEntryCreate' } })` en otro fichero no se sumaría al primero, lo **reemplazaría** en silencio. Por eso todo lo que dependa del audit log (antiraid y cualquier logging futuro) vive en este único fichero, documentado explícitamente para que nadie intente separarlo.

Esto sustituye por completo al enfoque legacy de hacer polling del audit log vía REST tras cada evento de canal/rol/ban — `guildAuditLogEntryCreate` es un evento real del gateway, así que el `executorId` llega directo en el payload sin ninguna petición HTTP de por medio.

El handler hace dos cosas, en este orden:
1. Si la acción es una de las que le importan al detector de ráfagas (`ChannelCreate/Delete/Update`, `RoleCreate/Delete`, `MemberBanAdd/Remove`), llama a `AntiraidSystem.detect()`.
2. Si el ejecutor no es el propio bot, intenta traducir la acción a un `ServerEventLog` (sección 4) y lo despacha.

El orden importa: el chequeo de antiraid va primero (o en paralelo) para que nunca lo retrase lo que se añada después en este mismo handler.

## 4. Logging — `BotActionLog` vs `ServerEventLog`

La detección de ráfaga registra un `ServerEventLog` de tipo `RaidDetected` — no un `BotActionLog`, aunque el bot sí ejecuta un ban. La regla es: si nadie pidió la acción mediante un comando, es un `ServerEventLog` (algo que pasó en el servidor), no un `BotActionLog` (algo que el bot hizo porque se lo pidieron). Cómo funcionan esos dos sistemas y por qué no se duplican entre sí está explicado aparte, en [`logs.md`](logs.md) — es un sistema transversal, no específico del antiraid.

## 5. Recuperación — `/unnuke` y `/backup`

**Ficheros:** [`src/commands/configuration/unnuke/`](../src/commands/configuration/unnuke/), [`src/systems/backup/BackupSystem.ts`](../src/systems/backup/BackupSystem.ts)

La detección puede fallar (raid coordinado con cuentas nuevas, gente actuando más despacio que el `threshold`, etc.), así que hace falta poder deshacer el daño manualmente:

- **`/unnuke bans|channels|roles|emojis`**: deshace cada tipo de destrozo por separado. `bans` desbanea a todo el mundo (deshace un ban masivo), los demás borran duplicados creados por spam usando `UnnukeHelpers.deleteDuplicates` (compara por nombre, borra todo menos la primera aparición). Cada subcomando tiene su propio cooldown (`@Cooldown.user`, grupo `unnuke` compartido entre los cuatro) para que no se puedan encadenar sin límite.
- **`/backup create|load|delete|info`**: snapshot completo del servidor (canales, roles, bans, emojis, stickers) que se puede restaurar entero si el raid fue tan grave que `/unnuke` no basta. Las descargas de imágenes (emojis/stickers) se hacen secuencialmente, no en paralelo, para no disparar ráfagas de peticiones al CDN de Discord durante la propia restauración.

Ambos flujos generan su `BotActionLog` correspondiente (`UnnukeBans`, `BackupLoad`, etc.) y ambos pasan por `Confirmation.ask()` antes de ejecutar nada, por ser acciones destructivas o difíciles de revertir.

## 6. Prerrequisitos para activarlo — `AntiraidPrerequisites`

**Ficheros:** [`src/systems/antiraid/AntiraidPrerequisites.ts`](../src/systems/antiraid/AntiraidPrerequisites.ts), [`src/events/guildRoleUpdate.ts`](../src/events/guildRoleUpdate.ts), [`guildRoleDelete.ts`](../src/events/guildRoleDelete.ts), [`guildMemberUpdate.ts`](../src/events/guildMemberUpdate.ts)

Un `antiraidEnable: true` en la base de datos no sirve de nada si el bot no puede actuar de verdad. `AntiraidPrerequisites.meets()` comprueba tres cosas, sin excepción:

- El bot tiene el permiso **Ban Members** — sin él, `client.bans.create()` en `AntiraidSystem.detect()` falla siempre.
- El bot tiene el permiso **View Audit Log** — sin él, Discord ni siquiera dispara el evento de gateway `guildAuditLogEntryCreate`, así que todo el sistema queda ciego, no solo el ban.
- El rol del bot ocupa la **posición más alta** de la jerarquía del servidor (no hace falta que esté marcado como "Mostrar rol por separado" — eso es cosmético, la jerarquía real de Discord depende solo de la posición). Sin esto, un atacante con un rol por encima del bot es literalmente imposible de banear vía API, permiso o no.

Las tres comprobaciones salen de la caché de gateway (roles + member propio, sincronizados vía `GUILD_CREATE`/`GUILD_ROLE_UPDATE`/`GUILD_MEMBER_UPDATE`) — cero red en el caso normal.

**No es un timer.** Los tres requisitos pueden dejar de cumplirse en cualquier momento (alguien reordena roles, le quita un permiso al bot), así que la validación tiene que ser continua — pero continua no significa "comprobarlo cada X minutos por si acaso": hay eventos reales que avisan exactamente cuándo puede haber cambiado, y `AntiraidSystem.recheckPrerequisites()` se llama desde esos tres, no desde un `setInterval`:

- `guildRoleUpdate` — la posición o los permisos de un rol cambiaron.
- `guildRoleDelete` — un rol desapareció (podría ser el propio del bot).
- `guildMemberUpdate`, filtrado a `member.id === client.botId` — los roles del propio bot cambiaron.

El único caso que ningún evento puede avisar es que el cambio ocurriera **mientras el bot estaba desconectado** — para eso, `AntiraidSystem.recheckAllPrerequisites()` se llama desde `ready`. Ojo: `ready` de Discord no es "arrancó el proceso", es "se abrió una sesión de gateway nueva" — y eso pasa tanto al arrancar como cada vez que el bot pierde la sesión y tiene que reidentificarse (no en un simple *resume*, que Discord repone solo reenviando lo perdido). Por eso [`src/events/ready.ts`](../src/events/ready.ts) ya **no** usa `once: true` para todo el handler — la inicialización real de una sola vez (pollers, caché) va detrás de un flag propio, y la recomprobación de prerrequisitos corre en cada `ready`, sea el primero o el número 50. Sigue sin ser un poller: no hay ningún `setInterval`, solo reacciona a la señal exacta de "puede que me haya perdido algo".

Si algún requisito deja de cumplirse, `AntiraidSystem.disable()` desactiva `antiraidEnable` en base de datos y registra un `ServerEventLog` de tipo `AntiraidDisabled` — no se queda activado-pero-inerte.

La dashboard, cuando exista, no decide si el servidor cumple los requisitos — solo refleja lo que diga el bot (o hace la misma comprobación por su cuenta contra la API REST de Discord). Es un espejo, no una segunda fuente de verdad.

## Lo que falta

A estas alturas ya no queda ninguna columna de `guild_protection` sin implementación en Seyfert: `antibots`, `maliciousMemberAction`, `raidmode`, `selfbot`, `intelligentSOS` y `verification` están todos hechos, ver [`antibots.md`](antibots.md), [`malicious-members.md`](malicious-members.md), [`raidmode.md`](raidmode.md), [`selfbot.md`](selfbot.md), [`intelligent-sos.md`](intelligent-sos.md) y [`verification.md`](verification.md). `antijoins` se eliminó del schema por completo — `raidmode` ya cubre "banear a quien se una" de sobra, y mejor. `guild_moderation` (`antiWebhooksFlood`, `antiflood`, y el resto del automod) también está hecho, ver [`moderation.md`](moderation.md) — `intelligentAntiflood` se eliminó del todo, sin sustituto.

`purgeWebhooksAttacks` (renombrado a `antiWebhooksFlood`) y `antiflood` ya no viven aquí — se movieron a [`src/database/schema/guild-moderation.ts`](../src/database/schema/guild-moderation.ts), porque ninguno de los dos es una defensa de entrada/estructural: ambos policían conducta de chat dentro del servidor (flood de mensajes, flood de webhooks), que es territorio de moderación aunque su respuesta sea un baneo inmediato en vez de una escalada de sanciones. Ambos con implementación real ya, ver [`moderation.md`](moderation.md). `intelligentAntiflood` se eliminó del todo, sin sustituto directo — su detección (mensaje idéntico repetido) se solapaba con lo que ya cubre `antiflood` básico.

`bloqEntritiesByName` (expulsar por nombre de usuario coincidente con una lista) también se eliminó del schema por completo, no quedó pendiente de diseño — se solapaba con lo que hace `SelfbotSystem` (ver [`selfbot.md`](selfbot.md)), y como filtro aislado por substring de nombre no aportaba nada que ese sistema no cubra ya mejor. `antitokens` y `bloqNewCreatedUsers` tampoco quedan pendientes por separado — `SelfbotSystem` los sustituye a ambos.

**Idea pendiente, descartada por ahora:** se consideró que `AntiraidSystem` contase también `AuditLogEvent.BotAdd` (alguien añade un bot al servidor) hacia el contador de ráfaga, con más peso si el bot añadido tiene la cuenta recién creada. Se descartó por dos motivos: (1) pesar por el sello de `VerifiedBot` no sirve, porque Discord permite verificar bots sin revisión manual — la verificación nunca fue una garantía real de que el bot no vaya a comportarse mal; (2) comprobar la antigüedad de la cuenta bien hecho es exactamente una de las señales que ya pesa `SelfbotSystem` — implementarlo ahora solo para esto duplicaría esa lógica.

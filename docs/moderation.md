# Automod — `AutomodSystem` / `AntiWebhooksFloodSystem`

**Ficheros:** [`src/systems/automod/AutomodSystem.ts`](../src/systems/automod/AutomodSystem.ts) (orquestador: decide si algo saltó), [`AutomodContentDetectors.ts`](../src/systems/automod/AutomodContentDetectors.ts) (comprobaciones puras de contenido), [`AutomodEscalation.ts`](../src/systems/automod/AutomodEscalation.ts) (qué pasa una vez confirmada la infracción: warn/escalada/aviso/log), [`AutomodTypes.ts`](../src/systems/automod/AutomodTypes.ts) (los enums `AutomodDetector`/`AutomodSanction` y las interfaces compartidas), [`AntiWebhooksFloodSystem.ts`](../src/systems/automod/AntiWebhooksFloodSystem.ts), [`src/events/messageCreate.ts`](../src/events/messageCreate.ts), [`src/events/messageDelete.ts`](../src/events/messageDelete.ts), [`src/events/autoModerationActionExecution.ts`](../src/events/autoModerationActionExecution.ts)

Detecta y sanciona conducta de chat que el AutoMod nativo de Discord no puede cubrir — analiza contenido mensaje a mensaje, nunca frecuencia a lo largo del tiempo ni la forma/proporción de un mensaje. Lo que sí cubre nativamente (palabras prohibidas, spam de menciones) queda deliberadamente fuera de aquí — ver la sección siguiente — pero sí se escucha cuando esas reglas nativas actúan, para que cuenten hacia la misma escalada (`nativeAutomod`, más abajo).

**Por qué está partido en cuatro ficheros, no uno solo:** `AutomodSystem` empezó siendo pequeño y acabó cargando con la detección, la decisión de borrar o no, el mute inmediato de flood, la escalada completa (warn/mute/kick/ban), los avisos en canal y el logging — todo en una sola clase. Se separó por responsabilidad: `AutomodSystem` solo decide *si* algo saltó (y para `ghostping`, cuándo se sabe); `AutomodContentDetectors` son funciones puras sin estado ni async (contar palabras/emojis, proporción de mayúsculas); `AutomodEscalation` es todo lo que pasa *después* de confirmada una infracción, sea cual sea su origen (los cinco detectores propios o `nativeAutomod`). `AutomodTypes` existe porque los enums e interfaces ahora los comparten los tres — vivían como tipos locales de un único fichero, y dejaron de tener sentido ahí en cuanto hubo que importarlos desde otro sitio.

**`AutomodDetector`/`AutomodSanction` son enums de verdad, no strings sueltos.** Antes eran uniones de literales de texto (`'flood' | 'ghostping' | ...`) comparadas a mano por todo el fichero — funcionaba, pero no seguía el mismo patrón que el resto del proyecto (`SelfbotAction`, `MaliciousMemberAction`, `AutomodFinalAction`, todos enums reales). Ahora son `AutomodDetector.Flood`, `AutomodSanction.Mute`, etc. — mismo criterio en todas partes, y el propio nombre del enum documenta qué representa cada valor en vez de dejarlo como un string que hay que interpretar por contexto.

## Qué se queda en el AutoMod nativo de Discord, y por qué no se reimplementa

`badwords` (`KEYWORD`/`KEYWORD_PRESET`) y `manyPings` (`MENTION_SPAM`) del automod legacy tienen equivalente nativo en Discord — configurable desde los propios ajustes del servidor, sin que SPA tenga que guardar ni sincronizar nada. `guild_moderation` no tiene ninguna columna para esto a propósito: la fuente de verdad ya es Discord, duplicarla solo introduciría la posibilidad de que se desincronicen.

**Cuando la dashboard ofrezca una UI para gestionar esto, habla directo contra la API de Discord — sin pasar por el bot.** A diferencia de `VerificationSystem` (ver `verification.md`), que sí necesita un pequeño proxy en el propio proceso del bot (`VerificationServer`) porque la acción depende de estado que solo el bot tiene resuelto (su caché de config, la jerarquía de roles ya cargada), gestionar una regla de AutoMod es una llamada REST autocontenida (`GET/POST/PATCH/DELETE /guilds/{id}/auto-moderation/rules`) que no necesita nada del proceso del bot — la dashboard ya tiene acceso directo al token del bot, así que la hace ella misma. Nada de esto se guarda en ninguna base de datos, ni la del bot ni la de la dashboard: se lee en vivo de Discord cada vez que se abre esa pantalla, y se actualiza al instante en el momento en que la propia llamada a Discord se resuelve — no hay paso de sincronización porque no hay copia que sincronizar.

**Riesgo a vigilar, no a resolver ahora:** la dashboard y el propio bot comparten el mismo token para hablar con Discord, cada uno con su propio conteo de rate limit sin coordinarse entre sí. Un pico de llamadas de AutoMod desde la dashboard justo cuando el bot está baneando/kickeando en paralelo podría toparse con un `429` que ninguno de los dos ve venir.

`linkDetect`/`iploggerFilter` y `nsfwFilter` tampoco se portan — el primero queda pendiente (dudoso solape con AutoMod nativo vía `KEYWORD` con lista de dominios), el segundo directamente fuera de alcance (Discord no da a los bots ningún clasificador de imágenes vía API).

**Se consideró, y se descartó, aproximar `capsLock`/`manyEmojis`/`manyWords` con reglas nativas.** Un `KEYWORD` con `regex_patterns` podría acercarse (ej. `[A-Z]{10,}` para mayúsculas seguidas), pero un regex no puede expresar "70% de las letras son mayúsculas" — solo patrones fijos, no proporciones. Para que el umbral siguiera siendo configurable por servidor, SPA tendría que generar y sincronizar un regex por servidor vía API, reabriendo exactamente el problema de "quién es la fuente de verdad" que se descartó para badwords/mass-pings. Y perderíamos la integración con la escalada propia (`warns`/subcount), porque el `TIMEOUT` de una regla de AutoMod es una acción fija, sin memoria de infracciones previas. Se quedan como detectores propios.

## `nativeAutomod` — cuando Discord decide, pero SPA se entera igual

**Fichero:** [`src/events/autoModerationActionExecution.ts`](../src/events/autoModerationActionExecution.ts)

Aunque SPA no gestiona las reglas nativas, sí escucha `AUTO_MODERATION_ACTION_EXECUTION` — el evento que Discord dispara cada vez que una regla de AutoMod del propio servidor actúa (badwords, mass-pings...) — y hace que esa infracción **sume a la misma escalada** que los cinco detectores propios (`AutomodSystem.handleNativeAction`). Sin esto, alguien podría spamear palabras prohibidas todo el día, Discord se lo bloquearía siempre, pero nunca se acercaría a un kick/ban por parte de SPA porque el bot nunca se enteraba.

No borra nada (Discord ya bloqueó el mensaje) ni avisa por canal (el propio `BLOCK_MESSAGE` de Discord ya le mostró al usuario por qué, un segundo aviso sería redundante) — solo inserta el warn con `moderatorId: WarnRepository.AutomodModeratorId` (`'SP Agency'`) y corre la misma comprobación de umbrales que todo lo demás.

Requiere el intent `AutoModerationExecution` (no privilegiado, sin nada que activar en el Developer Portal) — añadido en `seyfert.config.mjs`.

**Limitación conocida, aceptada a propósito:** si la regla del servidor tiene configuradas varias acciones a la vez (ej. `BLOCK_MESSAGE` + `SEND_ALERT_MESSAGE`), Discord dispara el evento una vez por acción — una sola infracción real podría sumar más de un punto a la escalada. Deduplicar esto con precisión pediría trackear `message_id`/ventanas de tiempo por poco beneficio real; se acepta la imprecisión, igual que `SelfbotSystem` acepta falsos positivos en su heurística de nombre — el peso es bajo (un punto más en la escalada, no una sanción directa) y el caso (una regla con múltiples acciones) no es el configurado por defecto.

## Los cinco detectores propios

- **`antiflood`**: ritmo de mensajes por usuario — `RollingWindowCounter` (5 mensajes / 5s, fijo en código). Ya existía la columna en `guild_moderation`, solo faltaba la implementación.
- **`ghostping`**: mencionar y borrar el mensaje poco después (ventana de 60s). No se puede detectar en el propio `messageCreate` — no se sabe que será un ghostping hasta que se borra. Ver la sección de abajo.
- **`capsLock`**: proporción de mayúsculas sobre el total de letras, con un mínimo de longitud fijo en código (`CapsLockMinLength = 10`) para que mensajes cortos tipo "OK" nunca lo disparen.
- **`manyEmojis`**: cuenta emojis custom (`<a?:nombre:id>`) + Unicode en un mensaje.
- **`manyWords`**: cuenta palabras (split por espacios) en un mensaje.

Cada uno tiene su propio enable + umbral en `guild_moderation`, salvo `antiflood` (umbral fijo, ver arriba) y `ghostping` (solo enable, no hay umbral que ajustar).

## Qué pasa con el mensaje, y quién se entera — no es lo mismo para todos

No todos los detectores reaccionan igual, a propósito:

| Detector | ¿Borra el mensaje? | ¿Acción inmediata? | ¿Aviso en el canal? |
|---|---|---|---|
| `flood` | **No** — 15 mensajes seguidos son la prueba de lo que pasó, no algo que borrar | **Sí** — timeout fijo de 15s (`FloodTimeoutMs`) al instante, aparte de la escalada normal | No |
| `ghostping` | N/A — ya lo borró el propio usuario | No | Sí — aviso público, mencionando también a quién había mencionado si se sabe |
| `capsLock` / `manyEmojis` / `manyWords` | Sí — el mensaje en sí es la infracción | No | Sí — breve, autoborrable |
| `nativeAutomod` (ver más abajo) | N/A — Discord ya lo bloqueó | No | No — el propio `BLOCK_MESSAGE` de Discord ya le explicó al usuario por qué |

`flood` prioriza actuar sobre explicar — parar el flood ya, sin ruido de chat, y que la persona se aguante la sanción, no que se le dé conversación mientras sigue mandando mensajes. El resto sí explica, porque no hay una urgencia equivalente que priorizar por encima de que la persona entienda qué pasó.

Los avisos en canal son mensajes normales que se autoborran a los 8s (`AnnouncementLifetimeMs`) — mismo criterio que el legacy usaba para badwords (mandar, esperar, borrar), con un margen de lectura algo mayor.

## `RollingWindowCounter` — por qué no reutiliza `BurstTracker`

**Fichero:** [`src/systems/shared/RollingWindowCounter.ts`](../src/systems/shared/RollingWindowCounter.ts)

`BurstTracker` (antiraid) dispara una vez y **resetea el contador** — correcto para "banea a quien lo disparó", incorrecto para "marca cada mensaje de una ráfaga en curso", donde cada mensaje adicional por encima del umbral debe seguir contando como un hit, no reiniciar desde cero. Ya se había resuelto esto una vez a mano dentro de `SelfbotSystem` (su señal de entradas simultáneas); con un segundo uso real (flood de mensajes/webhooks aquí), mereció la pena extraerlo en vez de copiarlo una tercera vez.

## `ExpiringMap` — el primitivo detrás de casi todo lo que "se limpia solo"

**Fichero:** [`src/systems/shared/ExpiringMap.ts`](../src/systems/shared/ExpiringMap.ts)

`RollingWindowCounter` y `BurstTracker` no gestionan su propio temporizador de limpieza — delegan en `ExpiringMap`, un `Map` genérico donde cada entrada se borra sola pasado un `ttlMs` salvo que se refresque antes con otro `set()`. No es exclusivo de estos dos: `AutomodSystem` (candidatos a ghostping), `IntelligentSosSystem` (cooldown de alertas) y `RaidmodeExpiry` (temporizador de expiración por servidor) también lo usan — los cinco tenían, cada uno por su cuenta, el mismo puñado de líneas escritas a mano (cancela el timer anterior si había, programa uno nuevo, bórrate al disparar). Un primitivo compartido en vez de una sexta copia ligeramente distinta de lo mismo.

`ExpiringMap` soporta un `onExpire` opcional para cuando expirar de verdad tiene que *hacer* algo (no solo desaparecer calladamente) — `RaidmodeExpiry` es el caso que lo necesita: al vencer el plazo, tiene que desactivar el raidmode, no solo olvidar que lo estaba vigilando.

**Por qué `LogChannelThrottle` (ver [`logs.md`](logs.md)) sigue sin usarlo:** necesita dos temporizadores independientes por servidor (uno para el próximo *flush*, otro para saber si lleva una ventana entera inactivo) y, al vencer este último, a veces la respuesta correcta es "todavía no, reprograma" en vez de "bórrate ya" — no encaja en el contrato de `ExpiringMap` (una entrada, un timer, se borra siempre al vencer). Forzarlo ahí habría cambiado código simple por una indirección más difícil de seguir, no al revés.

## Ghostping — por qué necesita dos eventos

**Ficheros:** [`src/events/messageCreate.ts`](../src/events/messageCreate.ts), [`src/events/messageDelete.ts`](../src/events/messageDelete.ts)

`messageCreate.ts` registra **todo** mensaje con mención (`AutomodSystem.trackForGhostping`) en un [`ExpiringMap`](../src/systems/shared/ExpiringMap.ts) de candidatos, con auto-limpieza a los 60s — sin comprobar si `ghostpingEnable` está activo, a propósito: eso costaría un `await` a `GuildConfigCache` en el mensaje más transitado de todo el bot, para casi siempre no hacer nada con el resultado. La comprobación real de `ghostpingEnable` se hace una sola vez, en `messageDelete.ts` (`AutomodSystem.handleDelete`), que es un evento mucho más raro por comparación — ahí sí compensa el `await`.

## `AntiWebhooksFloodSystem` — por qué no es un detector más de `AutomodSystem`

Un webhook no es un miembro con historial de warns, y su respuesta no pasa por la escalada — solo detecta el flood y borra el webhook. Es la misma categoría que `AntiraidSystem`/`RaidmodeSystem` (acción de seguridad directa ante un vector estructural), no una infracción de conducta — por eso vive aparte, con su propio `RollingWindowCounter` (4 mensajes / 10s, por guild, no por usuario).

**No banea al dueño del webhook, ni siquiera si reincide.** El diseño original sí lo hacía (columna `antiWebhooksFloodRememberOwner`, eliminada), asumiendo que quien crea el webhook es quien lo usa para floodear — un patrón real en 2020, cuando bastaba con `Manage Webhooks` para montar un raid así. Hoy el vector más probable es la fuga de la URL/token del webhook, abusada por alguien externo al servidor: el dueño del webhook es la víctima, no el atacante, y banearlo por "reincidencia" castigaría a la persona equivocada. De ahí que la única acción sea borrar el webhook — sin atribuir ni sancionar a nadie.

## La escalada — `warns` con `moderatorId: 'SPA'`, no `BotActionLog`

**Ficheros:** [`src/database/repositories/warn.repository.ts`](../src/database/repositories/warn.repository.ts), [`src/database/schema/guild-moderation.ts`](../src/database/schema/guild-moderation.ts)

Cada violación de los cinco detectores propios, más `nativeAutomod` (ver más arriba) — nunca del webhook flood, que no pasa por aquí — inserta una fila en `warns` con `moderatorId: WarnRepository.AutomodModeratorId` (`'SP Agency'`) — visible en `/warns` igual que un aviso humano, con esa autoría. **No usa `BotActionLog`**: eso sigue reservado a acciones que un humano pidió con un comando (ver [`logs.md`](logs.md)); esto lo decide el propio bot, así que cada violación también emite su `ServerEventLog` (`AutomodViolation`, con `data.detector`/`data.sanction`/`data.subCount`) — el registro de seguridad que SPA puede reutilizar, separado de la ficha de cara al usuario que es `warns`.

**El "subcount" no es una columna aparte.** `WarnRepository.countAutomod(guildId, userId)` cuenta `warns` filtrando por `moderatorId = 'SP Agency'` — nunca un contador guardado y mutado a mano. Toda la base de datos de este proyecto sigue el mismo principio (`warns`, `server_event_logs`, `bot_action_logs`: una fila por evento, nunca un contador editable), así que el subcount nunca puede desincronizarse del historial real — siempre es exactamente lo que dice la tabla.

La escalada, en `guild_moderation`:

- **`automodMuteAt`** (default 3) → al llegar exactamente a ese subcount, timeout nativo de Discord por `automodMuteMinutes` (default 10).
- **`automodFinalAction`** (`None | Kick | Ban`, default `None`) + **`automodFinalActionAt`** (default 6) → al llegar exactamente a ese subcount, se aplica.

Se compara con `===`, no `>=` — si se comparara con `>=`, cada mensaje sancionado después de cruzar el umbral repetiría el mute/kick/ban indefinidamente en vez de aplicarse una sola vez por umbral alcanzado.

## El intent que hace falta — `MessageContent`

**Fichero:** [`seyfert.config.mjs`](../seyfert.config.mjs)

Todo detector de contenido (`capsLock`/`manyEmojis`/`manyWords`) necesita `message.content`, que llega vacío sin el intent privilegiado `MessageContent` — añadido en la config del bot, pero **también hay que activarlo a mano en el Discord Developer Portal** (Bot → Privileged Gateway Intents → Message Content Intent) para esta aplicación, algo que el código no puede hacer por sí solo.

# Automod — `AutomodSystem` / `AntiWebhooksFloodSystem`

**Ficheros:** [`src/systems/automod/AutomodSystem.ts`](../src/systems/automod/AutomodSystem.ts), [`src/systems/automod/AntiWebhooksFloodSystem.ts`](../src/systems/automod/AntiWebhooksFloodSystem.ts), [`src/events/messageCreate.ts`](../src/events/messageCreate.ts), [`src/events/messageDelete.ts`](../src/events/messageDelete.ts)

Detecta y sanciona conducta de chat que el AutoMod nativo de Discord no puede cubrir — analiza contenido mensaje a mensaje, nunca frecuencia a lo largo del tiempo ni la forma/proporción de un mensaje. Lo que sí cubre nativamente (palabras prohibidas, spam de menciones) queda deliberadamente fuera de aquí — ver la sección siguiente.

## Qué se queda en el AutoMod nativo de Discord, y por qué no se reimplementa

`badwords` (`KEYWORD`/`KEYWORD_PRESET`) y `manyPings` (`MENTION_SPAM`) del automod legacy tienen equivalente nativo en Discord — configurable desde los propios ajustes del servidor, sin que SPA tenga que guardar ni sincronizar nada. `guild_moderation` no tiene ninguna columna para esto a propósito: si algún día el dashboard quiere ofrecer una UI para gestionarlo, hablaría directo contra la API de Discord (`client.guilds.moderation.*`), no contra una copia espejo en Postgres — la fuente de verdad ya es Discord, duplicarla solo introduciría la posibilidad de que se desincronicen.

`linkDetect`/`iploggerFilter` y `nsfwFilter` tampoco se portan — el primero queda pendiente (dudoso solape con AutoMod nativo vía `KEYWORD` con lista de dominios), el segundo directamente fuera de alcance (Discord no da a los bots ningún clasificador de imágenes vía API).

## Los cinco detectores propios

- **`antiflood`**: ritmo de mensajes por usuario — `RollingWindowCounter` (5 mensajes / 5s, fijo en código). Ya existía la columna en `guild_moderation`, solo faltaba la implementación.
- **`ghostping`**: mencionar y borrar el mensaje poco después (ventana de 60s). No se puede detectar en el propio `messageCreate` — no se sabe que será un ghostping hasta que se borra. Ver la sección de abajo.
- **`capsLock`**: proporción de mayúsculas sobre el total de letras, con un mínimo de longitud fijo en código (`CapsLockMinLength = 10`) para que mensajes cortos tipo "OK" nunca lo disparen.
- **`manyEmojis`**: cuenta emojis custom (`<a?:nombre:id>`) + Unicode en un mensaje.
- **`manyWords`**: cuenta palabras (split por espacios) en un mensaje.

Cada uno tiene su propio enable + umbral en `guild_moderation`, salvo `antiflood` (umbral fijo, ver arriba) y `ghostping` (solo enable, no hay umbral que ajustar).

## `RollingWindowCounter` — por qué no reutiliza `BurstTracker`

**Fichero:** [`src/systems/shared/RollingWindowCounter.ts`](../src/systems/shared/RollingWindowCounter.ts)

`BurstTracker` (antiraid) dispara una vez y **resetea el contador** — correcto para "banea a quien lo disparó", incorrecto para "marca cada mensaje de una ráfaga en curso", donde cada mensaje adicional por encima del umbral debe seguir contando como un hit, no reiniciar desde cero. Ya se había resuelto esto una vez a mano dentro de `SelfbotSystem` (su señal de entradas simultáneas); con un segundo uso real (flood de mensajes/webhooks aquí), mereció la pena extraerlo en vez de copiarlo una tercera vez. Mismo patrón de auto-limpieza que el resto: cada entrada se borra sola si no recibe ningún hit durante una ventana entera.

## Ghostping — por qué necesita dos eventos

**Ficheros:** [`src/events/messageCreate.ts`](../src/events/messageCreate.ts), [`src/events/messageDelete.ts`](../src/events/messageDelete.ts)

`messageCreate.ts` registra **todo** mensaje con mención (`AutomodSystem.trackForGhostping`) en un `Map` de candidatos con auto-limpieza a los 60s — sin comprobar si `ghostpingEnable` está activo, a propósito: eso costaría un `await` a `GuildConfigCache` en el mensaje más transitado de todo el bot, para casi siempre no hacer nada con el resultado. La comprobación real de `ghostpingEnable` se hace una sola vez, en `messageDelete.ts` (`AutomodSystem.handleDelete`), que es un evento mucho más raro por comparación — ahí sí compensa el `await`.

## `AntiWebhooksFloodSystem` — por qué no es un detector más de `AutomodSystem`

Un webhook no es un miembro con historial de warns, y su respuesta no pasa por la escalada — borra el webhook directamente y banea al dueño si reincide (reutilizando `antiWebhooksFloodRememberOwner`, que ya existía en el schema). Es la misma categoría que `AntiraidSystem`/`RaidmodeSystem` (acción de seguridad directa ante un vector estructural), no una infracción de conducta — por eso vive aparte, con su propio `RollingWindowCounter` (4 mensajes / 10s, por guild, no por usuario).

## La escalada — `warns` con `moderatorId: 'SPA'`, no `BotActionLog`

**Ficheros:** [`src/database/repositories/warn.repository.ts`](../src/database/repositories/warn.repository.ts), [`src/database/schema/guild-moderation.ts`](../src/database/schema/guild-moderation.ts)

Cada violación de los cinco detectores (nunca del webhook flood, que no pasa por aquí) inserta una fila en `warns` con `moderatorId: AutomodModeratorId` (`'SPA'`) — visible en `/warns` igual que un aviso humano, con esa autoría. **No usa `BotActionLog`**: eso sigue reservado a acciones que un humano pidió con un comando (ver [`logs.md`](logs.md)); esto lo decide el propio bot, así que cada violación también emite su `ServerEventLog` (`AutomodViolation`, con `data.detector`/`data.sanction`/`data.subCount`) — el registro de seguridad que SPA puede reutilizar, separado de la ficha de cara al usuario que es `warns`.

**El "subcount" no es una columna aparte.** `WarnRepository.countAutomod(guildId, userId)` cuenta `warns` filtrando por `moderatorId = 'SPA'` — nunca un contador guardado y mutado a mano. Toda la base de datos de este proyecto sigue el mismo principio (`warns`, `server_event_logs`, `bot_action_logs`: una fila por evento, nunca un contador editable), así que el subcount nunca puede desincronizarse del historial real — siempre es exactamente lo que dice la tabla.

La escalada, en `guild_moderation`:

- **`automodMuteAt`** (default 3) → al llegar exactamente a ese subcount, timeout nativo de Discord por `automodMuteMinutes` (default 10).
- **`automodFinalAction`** (`None | Kick | Ban`, default `None`) + **`automodFinalActionAt`** (default 6) → al llegar exactamente a ese subcount, se aplica.

Se compara con `===`, no `>=` — si se comparara con `>=`, cada mensaje sancionado después de cruzar el umbral repetiría el mute/kick/ban indefinidamente en vez de aplicarse una sola vez por umbral alcanzado.

## El intent que hace falta — `MessageContent`

**Fichero:** [`seyfert.config.mjs`](../seyfert.config.mjs)

Todo detector de contenido (`capsLock`/`manyEmojis`/`manyWords`) necesita `message.content`, que llega vacío sin el intent privilegiado `MessageContent` — añadido en la config del bot, pero **también hay que activarlo a mano en el Discord Developer Portal** (Bot → Privileged Gateway Intents → Message Content Intent) para esta aplicación, algo que el código no puede hacer por sí solo.

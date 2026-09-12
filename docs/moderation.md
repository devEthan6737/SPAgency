# Automod — `AutomodSystem` / `AntiWebhooksFloodSystem`

**Ficheros:** [`src/systems/automod/AutomodSystem.ts`](../src/systems/automod/AutomodSystem.ts) (orquestador), [`AutomodContentDetectors.ts`](../src/systems/automod/AutomodContentDetectors.ts) (checks puros de contenido), [`AutomodEscalation.ts`](../src/systems/automod/AutomodEscalation.ts) (warn/escalada/aviso/log tras confirmar infracción), [`AutomodTypes.ts`](../src/systems/automod/AutomodTypes.ts) (enums/interfaces compartidos), [`AntiWebhooksFloodSystem.ts`](../src/systems/automod/AntiWebhooksFloodSystem.ts), [`messageCreate.ts`](../src/events/messageCreate.ts), [`messageDelete.ts`](../src/events/messageDelete.ts), [`autoModerationActionExecution.ts`](../src/events/autoModerationActionExecution.ts)

Detecta y sanciona conducta de chat que el AutoMod nativo de Discord no cubre — mensaje a mensaje, nunca frecuencia ni proporción. Lo que sí cubre nativamente (badwords, mass-pings) queda fuera de aquí, pero se escucha cuando actúa para que cuente hacia la misma escalada (`nativeAutomod`).

**Por qué está partido en cuatro ficheros:** `AutomodSystem` empezó pequeño y acabó con detección + borrar-o-no + mute inmediato + escalada + avisos + logging en una sola clase. Separado por responsabilidad: `AutomodSystem` decide *si* algo saltó; `AutomodContentDetectors` son funciones puras sin estado; `AutomodEscalation` es todo lo que pasa *después* de la infracción (de cualquier origen); `AutomodTypes` porque los tres comparten enums/interfaces.

**`AutomodDetector`/`AutomodSanction` son enums reales**, no uniones de string comparadas a mano — mismo patrón que `SelfbotAction`/`MaliciousMemberAction`/`AutomodFinalAction`.

## Qué se queda en el AutoMod nativo, y por qué no se reimplementa

`badwords` (`KEYWORD`/`KEYWORD_PRESET`) y `manyPings` (`MENTION_SPAM`) tienen equivalente nativo, configurable desde Discord — `guild_moderation` no tiene columna para esto a propósito: Discord ya es la fuente de verdad, duplicarla abre la puerta a desincronización.

**La dashboard hablará directo contra la API de Discord, sin proxy en el bot.** A diferencia de `VerificationSystem` (necesita el proceso del bot porque depende de su caché/jerarquía ya resuelta), gestionar una regla de AutoMod es REST autocontenido (`GET/POST/PATCH/DELETE /guilds/{id}/auto-moderation/rules`) — la dashboard ya tiene el token del bot, lo hace ella misma. Nada se guarda en ninguna DB; se lee en vivo cada vez. Riesgo a vigilar, no a resolver ahora: dashboard y bot comparten token, cada uno con su propio conteo de rate limit sin coordinarse.

`linkDetect`/`iploggerFilter`/`nsfwFilter` no se portan — el primero pendiente (solapa con `KEYWORD` + lista de dominios), el segundo fuera de alcance (sin clasificador de imágenes vía API).

**Se descartó aproximar `capsLock`/`manyEmojis`/`manyWords` con reglas nativas** (`regex_patterns` de un `KEYWORD`): un regex no expresa "70% de las letras son mayúsculas", solo patrones fijos. Habría que generar/sincronizar un regex por servidor (mismo problema de fuente de verdad ya descartado) y se perdería la integración con la escalada propia (el `TIMEOUT` de AutoMod no tiene memoria de infracciones previas).

## `nativeAutomod` — Discord decide, SPA se entera igual

**Fichero:** [`src/events/autoModerationActionExecution.ts`](../src/events/autoModerationActionExecution.ts)

Escucha `AUTO_MODERATION_ACTION_EXECUTION` y hace que esa infracción sume a la misma escalada (`AutomodSystem.handleNativeAction`) — sin esto, alguien podría spamear badwords todo el día sin acercarse nunca a un kick/ban de SPA. No borra nada ni avisa por canal (Discord ya lo hizo) — solo warn con `moderatorId: WarnRepository.AutomodModeratorId` (`'SP Agency'`) y chequeo de umbrales. Requiere intent `AutoModerationExecution` (no privilegiado).

**Limitación aceptada:** una regla con varias acciones (`BLOCK_MESSAGE` + `SEND_ALERT_MESSAGE`) dispara el evento una vez por acción, pudiendo sumar más de un punto por infracción real. Deduplicar con precisión no compensa (peso bajo, caso no default) — misma filosofía que los falsos positivos aceptados en `SelfbotSystem`.

## Los cinco detectores propios

- **`antiflood`**: ritmo por usuario, `RollingWindowCounter` (5 msg / 5s, fijo).
- **`ghostping`**: mencionar y borrar en <60s. No detectable en `messageCreate` — no se sabe hasta que se borra.
- **`capsLock`**: % mayúsculas, mínimo `CapsLockMinLength=10` para no disparar con "OK".
- **`manyEmojis`**: cuenta emojis custom + Unicode.
- **`manyWords`**: cuenta palabras.

Cada uno con enable+umbral en `guild_moderation`, salvo `antiflood` (fijo) y `ghostping` (solo enable).

## Feedback por detector — no todos reaccionan igual

| Detector | ¿Borra? | ¿Acción inmediata? | ¿Aviso en canal? |
|---|---|---|---|
| `flood` | No — es la prueba | Sí — timeout 15s (`FloodTimeoutMs`) aparte de la escalada | No |
| `ghostping` | N/A (ya lo borró el usuario) | No | Sí — público, menciona a quién si se sabe |
| `capsLock`/`manyEmojis`/`manyWords` | Sí — el mensaje es la infracción | No | Sí — breve, autoborrable (8s, `AnnouncementLifetimeMs`) |
| `nativeAutomod` | N/A (Discord ya bloqueó) | No | No — redundante con el `BLOCK_MESSAGE` de Discord |

`flood` prioriza actuar sobre explicar (parar ya, sin ruido); el resto sí explica, sin urgencia equivalente que priorizar.

## `RollingWindowCounter` vs `BurstTracker`

**Fichero:** [`src/systems/shared/RollingWindowCounter.ts`](../src/systems/shared/RollingWindowCounter.ts)

`BurstTracker` resetea al disparar (correcto para "banea al causante"); esto no sirve para marcar cada mensaje de una ráfaga en curso. Ya resuelto una vez a mano en `SelfbotSystem`; extraído al segundo uso real (flood de mensajes/webhooks).

## `ExpiringMap` — primitivo detrás de "se limpia solo"

**Fichero:** [`src/systems/shared/ExpiringMap.ts`](../src/systems/shared/ExpiringMap.ts)

`Map` genérico donde cada entrada se borra sola pasado un `ttlMs` salvo refresco. Usado por `RollingWindowCounter`, `BurstTracker`, `AutomodSystem` (candidatos ghostping), `IntelligentSosSystem` (cooldowns), `RaidmodeExpiry` (timer de expiración) — cinco copias manuales del mismo puñado de líneas, ahora un primitivo. Soporta `onExpire` para cuando expirar debe *hacer* algo (`RaidmodeExpiry` desactivando raidmode).

**`LogChannelThrottle` no lo usa**: necesita dos timers independientes por servidor (flush + inactividad) y a veces "reprograma" en vez de "bórrate ya" — no encaja en el contrato de una entrada/un timer/siempre se borra.

## Ghostping — dos eventos

`messageCreate.ts` registra todo mensaje con mención en un `ExpiringMap` (60s), sin comprobar `ghostpingEnable` — evitaría un `await` a `GuildConfigCache` en el evento más transitado del bot para casi nunca usarlo. El chequeo real pasa una sola vez, en `messageDelete.ts` (mucho más raro), donde sí compensa.

## `AntiWebhooksFloodSystem` — por qué no es un detector más

Un webhook no es un miembro con historial de warns, no pasa por la escalada — solo detecta flood y borra el webhook. Misma categoría que `AntiraidSystem`/`RaidmodeSystem` (acción de seguridad directa), no infracción de conducta. `RollingWindowCounter` propio (4 msg / 10s, por guild).

**No banea al dueño del webhook, ni en reincidencia.** El diseño original sí lo hacía (columna eliminada), asumiendo que el creador es el atacante — un patrón de 2020. Hoy el vector más probable es un token filtrado, abusado por alguien externo: el creador es la víctima, no el atacante.

## La escalada — `warns` con `moderatorId: 'SP Agency'`

**Ficheros:** [`warn.repository.ts`](../src/database/repositories/warn.repository.ts), [`guild-moderation.ts`](../src/database/schema/guild-moderation.ts)

Cada violación (los cinco detectores + `nativeAutomod`, nunca webhook flood) inserta una fila en `warns` con `moderatorId: WarnRepository.AutomodModeratorId` — visible en `/warns` como un warn humano. No usa `BotActionLog` (eso es solo para comandos humanos); emite su propio `ServerEventLog` (`AutomodViolation`, `data.detector`/`sanction`/`subCount`).

**El "subcount" no es una columna** — `countAutomod()` cuenta `warns` filtrando por ese `moderatorId`, nunca un contador mutado a mano (mismo principio que toda la DB: una fila por evento, nunca un contador editable).

- **`automodMuteAt`** (default 3) → timeout nativo por `automodMuteMinutes` (default 10).
- **`automodFinalAction`** (`None|Kick|Ban`, default `None`) + **`automodFinalActionAt`** (default 6).

Comparación con `===`, no `>=` — si no, cada mensaje tras cruzar el umbral repetiría la sanción indefinidamente.

## Intent necesario — `MessageContent`

**Fichero:** [`seyfert.config.mjs`](../seyfert.config.mjs)

Los detectores de contenido necesitan `message.content`, vacío sin el intent privilegiado `MessageContent` — también hay que activarlo a mano en el Developer Portal (Bot → Privileged Gateway Intents), el código no puede hacerlo.

# Logs — `BotActionLog` vs `ServerEventLog`

**Ficheros:** [`src/systems/logs/actions/BotActionLog.ts`](../src/systems/logs/actions/BotActionLog.ts), [`src/systems/logs/events/ServerEventLog.ts`](../src/systems/logs/events/ServerEventLog.ts), [`src/systems/logs/Log.ts`](../src/systems/logs/Log.ts), [`src/systems/logs/dispatch.ts`](../src/systems/logs/dispatch.ts)

## Qué es esto, y qué no es

Este sistema de logs es **un registro de seguridad que el propio SPA reutiliza** — no una auditoría general de moderación para que un mod la lea por curiosidad. La pregunta correcta para decidir si algo merece un `ServerEventType`/`BotActionType` nuevo nunca es "¿le interesaría esto a un mod?" — es **"¿hace SPA algo con este registro?"** (incluida la futura dashboard, en tanto que refleja el propio estado de seguridad de SPA — no un visor de eventos genérico).

Ejemplo concreto de esta regla en acción: **SPA no loguea mensajes borrados**, aunque es una función común en bots de moderación y técnicamente posible (cacheando el mensaje mientras existe — Discord no entrega el contenido de un mensaje ya borrado por ningún medio, ni siquiera el audit log). Se descarta no por ser difícil ni por prioridad, sino porque un mensaje borrado no dispara ninguna decisión de SPA — no banea, no reconfigura nada, no alimenta ningún sistema. Si algún día hace falta mostrarlo a un mod, es una función de moderación general (junto a purgar mensajes, etc.), no un log de SPA.

Hay dos preguntas distintas que un log **sí perteneciente a este sistema** puede responder, y se modelan como dos tablas separadas:

- **`BotActionLog` → `bot_action_logs`**: "¿qué hizo el bot porque alguien se lo pidió?" (un ban con `/ban`, un warn, restaurar un backup...). Siempre tiene un `executorId` humano real detrás de un comando. Cada comando construye su propio log con su color y descripción — no hay una tabla central ni un switch que traduzca un tipo genérico, el propio comando ya tiene toda esa información para su embed de respuesta.
- **`ServerEventLog` → `server_event_logs`**: "¿qué pasó en el servidor, lo haya hecho quien lo haya hecho?" — incluye tanto lo detectado vía audit log (alguien crea un canal a mano desde Discord) como las acciones que el propio bot toma **por su cuenta**, sin que nadie las pidiera con un comando (un raid detectado y baneado por `AntiraidSystem`, un bot expulsado por `AntibotsSystem`). La regla es simple: si no hay un `executorId` humano real detrás, es un `ServerEventLog`, nunca un `BotActionLog` con `executorId: 'system'` — esa alternativa (`BotActionType.AutomodAction`) se probó y se quitó del schema por no aportar nada que `ServerEventLog` no cubriera ya mejor.

  Lo detectado vía audit log se resuelve con `ServerEventLog.fromAuditLogEntry()`, contra una tabla declarativa (`Record<AuditLogEvent, plantilla>`) — no un switch, porque cada rama solo asigna los mismos tres campos (tipo, color, descripción), no hay comportamiento distinto por rama (ver la regla correspondiente en `CONTRIBUTING.md`). Las acciones que el bot decide por su cuenta (antiraid, antibots) no pasan por esa tabla — cada sistema construye su propio `ServerEventLog` con un `private static log(...)` debajo de su método principal, igual que hace un comando con `BotActionLog`.

## Por qué no se duplican

Si un mod usa `/ban`, eso genera tanto una entrada de audit log (con el bot como ejecutor, desde el punto de vista de Discord) como una llamada directa a `BotActionLog` desde el comando. Sin cuidado, ambas rutas registrarían el mismo ban dos veces.

El guard `if (entry.userId === client.botId) return` en [`guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts) corta la ruta de `ServerEventLog` exactamente en ese caso — las acciones que pasan por un comando del bot quedan cubiertas por su `BotActionLog` (con el humano real como ejecutor, no el bot), y `ServerEventLog` solo se encarga de lo que pasa **fuera** del bot (UI de Discord, otro bot, otro usuario).

## Base común — `Log`

Ambas clases heredan de una única base abstracta (`Log<Type, Table>`, sin capas intermedias): declaran color, descripción, tabla y fila mediante métodos abstractos, y `Log` resuelve por su cuenta cómo renderizarse como embed (`toEmbed`) y cómo persistirse (`save`). La descripción se construye en el idioma configurado del servidor, no en el de quien disparó la acción — para eso recibe un `SeyfertLocale` (`client.t(guild.language)`) en vez de usar `ctx.t`, igual que cualquier otro mensaje sin invocador directo delante.

## `dispatchLog` — guardado vs canal de logs

Ambos tipos de log se guardan siempre en su tabla, tenga o no tenga el servidor un canal de logs configurado. `guild_configuration` **no tiene** un booleano `logsEnable` separado — ni lo tuvo nunca el bot legacy (`logs.js` fijaba o vaciaba el canal directamente, sin un interruptor aparte). "¿Hay canal configurado?" ya responde por sí solo a "¿están los logs activos?"; añadir un segundo campo solo crearía un estado contradictorio posible (`enable: true` con canal vacío, o viceversa) sin cubrir ningún caso de uso real. Esto vive en `dispatchLog()` ([`dispatch.ts`](../src/systems/logs/dispatch.ts)):

**`language`/`logsChannel` salen de `GuildConfigCache`, no de una consulta propia.** `dispatchLog()` es, de lejos, la ruta más transitada del bot — corre en cada ban del antiraid, cada kick de antibots, cada acción del raidmode, cada entrada de audit log logueada y cada comando de moderación. Antes hacía su propio `INNER JOIN` contra Postgres en cada llamada; ahora reusa la misma caché en memoria que ya usan los sistemas de protección para `antiraidEnable`/`antibotsEnable`/etc. — ver `antiraid.md` sección 2 para cómo se mantiene fresca. Como `language` vive en `guilds` (no en `guild_configuration`, que sí tenía ya el trigger), hizo falta añadir un trigger propio a `guilds` (`drizzle/0018_guilds_notify_config_changed.sql`) con su propia función (`NEW.id` en vez de `NEW.guild_id`, porque `guilds` usa `id` como PK) — mismo canal `guild_config_changed`, así que `GuildConfigCache` no necesitó cambiar cómo escucha, solo qué guarda.

1. `log.save()` — siempre, incondicional.
2. Si no hay `logsChannel` configurado, corta ahí.
3. Si el envío al canal falla por lo que sea (canal borrado, acceso perdido, una caída puntual de Discord...), `logsChannel` se limpia en la config del servidor — así no se reintenta contra un destino roto en cada acción futura. Una sola rama de error para todo: al no haber un interruptor independiente del canal, no hay dos estados distintos que decidir entre sí.
4. Ese fallo además genera su propio `ServerEventLog` de tipo `LogsDisabled` — no se manda a ningún canal (el que lo recibiría es justo el que se acaba de desactivar), solo queda guardado en `server_event_logs` para que la futura dashboard pueda mostrar "aquí se desactivaron los logs y por qué" sin depender de que alguien mirara la consola del bot en su momento.

## Sin inundar el canal — `LogChannelThrottle`

**Fichero:** [`src/systems/logs/LogChannelThrottle.ts`](../src/systems/logs/LogChannelThrottle.ts)

`dispatchLog()` guarda el log en su tabla siempre, incondicionalmente — pero un raid genera decenas de `ServerEventLog` en pocos segundos (uno por cada canal/rol tocado por el atacante, salte o no el ban), y mandar un mensaje por cada uno reventaría el rate-limit del canal (~5 mensajes/5s) justo cuando más importa que el canal siga funcionando. `LogChannelThrottle` limita a `MaxSendsPerWindow` (3) mensajes cada `WindowMs` (10s) por servidor; lo que se pasa de ahí no se pierde — se apila y se manda junto en un solo mensaje (hasta `MaxEmbedsPerMessage`, el límite real de Discord: 10 embeds por mensaje) en cuanto vuelve a haber hueco.

El `Map` interno se limpia solo: en cuanto pasa una ventana entera sin nada pendiente para un servidor, su entrada se borra (mismo principio que `BurstTracker`/`GuildConfigCache` — nada se queda ocupando memoria indefinidamente solo por haber tocado ese servidor una vez).

**¿Por qué esto no vive en Redis, y por qué sí podría acabar ahí algún día (a diferencia de `BurstTracker`/`GuildConfigCache`, ver `antiraid.md` sección 2):** este `Map` no está en el camino de ninguna decisión de seguridad — no decide si banear a nadie, solo decide si un mensaje se manda ya o se espera un poco. Meterle una petición de red (aunque sea a un Redis en la misma VPS) no compromete ningún principio de diseño, porque `dispatchLog()` ya es fire-and-forget de por sí. Aun así, hoy no hace falta: el bot es un único proceso, así que un `Map` en memoria ve exactamente el mismo estado que vería cualquier alternativa. Solo tendría sentido moverlo si:

1. El bot deja de ser un único proceso y necesita que varios procesos vean la misma cola de un servidor (no aplica hoy — cada guild lo procesa siempre el mismo proceso/shard).
2. Otro servicio (la futura dashboard, por ejemplo) necesita ver este estado efímero en vivo — algo que hoy no existe en ningún sitio, ni falta hace.

Mientras ninguna de las dos se cumpla, Redis aquí sería complejidad añadida sin beneficio real, no una mejora.

## Uso desde un comando o un sistema

Cada comando con una acción real (para `BotActionLog`) o cada sistema de protección (para `ServerEventLog`, ej. `AntiraidSystem`/`AntibotsSystem`) declara un `private static log(...)` justo debajo de su método principal (`run()` en un comando, `detect()`/`enforce()` en un sistema), con un `LogInput` con nombres (nunca una lista larga de parámetros posicionales), y lo despacha sin bloquear lo que esté haciendo:

```ts
void dispatchLog(ctx.client, BanCommand.log({ guildId: guild.id, targetId, executorId: ctx.author.id, reason })).catch(() => {});
void dispatchLog(client, AntibotsSystem.log({ guildId: member.guildId, targetId: member.user.id })).catch(() => {});
```

El `void` es intencional: documenta que la promesa es fire-and-forget a propósito (el log no debe retrasar ni poder tumbar la respuesta del comando), no un olvido de `await`.

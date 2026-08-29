# Logs — `BotActionLog` vs `ServerEventLog`

**Ficheros:** [`src/systems/logs/actions/BotActionLog.ts`](../src/systems/logs/actions/BotActionLog.ts), [`src/systems/logs/events/ServerEventLog.ts`](../src/systems/logs/events/ServerEventLog.ts), [`src/systems/logs/Log.ts`](../src/systems/logs/Log.ts), [`src/systems/logs/dispatch.ts`](../src/systems/logs/dispatch.ts)

Hay dos preguntas distintas que un log puede responder, y se modelan como dos tablas separadas:

- **`BotActionLog` → `bot_action_logs`**: "¿qué hizo el bot porque alguien se lo pidió?" (un ban con `/ban`, un warn, restaurar un backup...). Cada comando construye su propio log con su color y descripción — no hay una tabla central ni un switch que traduzca un tipo genérico, el propio comando ya tiene toda esa información para su embed de respuesta.
- **`ServerEventLog` → `server_event_logs`**: "¿qué pasó en el servidor, lo haya hecho quien lo haya hecho?" (alguien crea un canal a mano desde Discord, un raid detectado). Se alimenta del audit log vía `ServerEventLog.fromAuditLogEntry()`, que resuelve el tipo de acción contra una tabla declarativa (`Record<AuditLogEvent, plantilla>`) — no un switch, porque cada rama solo asigna los mismos tres campos (tipo, color, descripción), no hay comportamiento distinto por rama (ver la regla correspondiente en `CONTRIBUTING.md`).

## Por qué no se duplican

Si un mod usa `/ban`, eso genera tanto una entrada de audit log (con el bot como ejecutor, desde el punto de vista de Discord) como una llamada directa a `BotActionLog` desde el comando. Sin cuidado, ambas rutas registrarían el mismo ban dos veces.

El guard `if (entry.userId === client.botId) return` en [`guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts) corta la ruta de `ServerEventLog` exactamente en ese caso — las acciones que pasan por un comando del bot quedan cubiertas por su `BotActionLog` (con el humano real como ejecutor, no el bot), y `ServerEventLog` solo se encarga de lo que pasa **fuera** del bot (UI de Discord, otro bot, otro usuario).

## Base común — `Log`

Ambas clases heredan de una única base abstracta (`Log<Type, Table>`, sin capas intermedias): declaran color, descripción, tabla y fila mediante métodos abstractos, y `Log` resuelve por su cuenta cómo renderizarse como embed (`toEmbed`) y cómo persistirse (`save`). La descripción se construye en el idioma configurado del servidor, no en el de quien disparó la acción — para eso recibe un `SeyfertLocale` (`client.t(guild.language)`) en vez de usar `ctx.t`, igual que cualquier otro mensaje sin invocador directo delante.

## `dispatchLog` — guardado vs canal de logs

Ambos tipos de log se guardan siempre en su tabla, pase lo que pase con el toggle `logsEnable` del servidor — ese toggle solo controla si además se envían como embed al canal de logs configurado. Esto vive en `dispatchLog()` ([`dispatch.ts`](../src/systems/logs/dispatch.ts)):

1. `log.save()` — siempre, incondicional.
2. Si `logsEnable` es `false` o no hay `logsChannel` configurado, corta ahí.
3. Si el envío al canal falla con 403/404 (el bot perdió acceso, o el canal se borró), `logsChannel` se limpia solo en la config del servidor — así no se reintenta contra un canal muerto en cada acción futura.

## Uso desde un comando

Cada comando con una acción real declara un `private static log(...)` justo debajo de `run()`, con un `LogInput` con nombres (nunca una lista larga de parámetros posicionales), y lo despacha sin bloquear la respuesta al usuario:

```ts
void dispatchLog(ctx.client, BanCommand.log({ guildId: guild.id, targetId, executorId: ctx.author.id, reason })).catch(() => {});
```

El `void` es intencional: documenta que la promesa es fire-and-forget a propósito (el log no debe retrasar ni poder tumbar la respuesta del comando), no un olvido de `await`.

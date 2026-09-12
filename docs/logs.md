# Logs — `BotActionLog` vs `ServerEventLog`

**Ficheros:** [`src/systems/logs/actions/BotActionLog.ts`](../src/systems/logs/actions/BotActionLog.ts), [`src/systems/logs/events/ServerEventLog.ts`](../src/systems/logs/events/ServerEventLog.ts), [`src/systems/logs/Log.ts`](../src/systems/logs/Log.ts), [`src/systems/logs/dispatch.ts`](../src/systems/logs/dispatch.ts)

## Qué es, y qué no

Registro de seguridad que **SPA reutiliza**, no una auditoría para que un mod la lea. La pregunta para decidir un `ServerEventType`/`BotActionType` nuevo nunca es "¿le interesaría a un mod?" sino **"¿hace SPA algo con esto?"** (incluida la dashboard, en tanto refleje el propio estado de seguridad de SPA).

Ejemplo: SPA no loguea mensajes borrados, aunque es técnicamente posible (cacheando mientras existen) — se descarta porque un mensaje borrado no dispara ninguna decisión de SPA. Si algún día hace falta para un mod, es moderación general, no un log de SPA.

Dos tablas, dos preguntas:

- **`BotActionLog`**: "¿qué hizo el bot porque alguien se lo pidió?" (ban con `/ban`, warn, restaurar backup). Siempre un `executorId` humano real. Cada comando construye su propio log.
- **`ServerEventLog`**: "¿qué pasó en el servidor, lo haga quien lo haga?" — audit log detectado (alguien crea un canal a mano) + acciones que el bot toma por su cuenta (raid baneado, bot expulsado). Si no hay `executorId` humano real, es `ServerEventLog`, nunca `BotActionLog` con `executorId: 'system'` (esa alternativa se probó y se quitó).

  Lo de audit log pasa por `ServerEventLog.fromAuditLogEntry()` contra una tabla declarativa (`Record<AuditLogEvent, plantilla>`), no un switch — cada rama solo asigna tipo/color/descripción. Las acciones que decide el propio bot (antiraid, antibots) construyen su `ServerEventLog` con un `private static log(...)` propio.

## Por qué no se duplican

Un `/ban` genera tanto entrada de audit log (bot como ejecutor) como `BotActionLog` directo desde el comando — sin cuidado, se registraría dos veces. El guard `if (entry.userId === client.botId) return` en [`guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts) corta esa ruta: lo que pasa por un comando ya lo cubre su `BotActionLog`, `ServerEventLog` solo cubre lo que pasa fuera del bot.

## Base común — `Log`

Ambas heredan de `Log<Type, Table>` (declaran color/descripción/tabla/fila, `Log` resuelve `toEmbed`/`save`). La descripción se construye en el idioma del servidor (`client.t(guild.language)`), no el de quien disparó la acción.

## `dispatchLog` — guardado vs canal

Ambos tipos se guardan siempre en su tabla, tenga o no canal configurado. No hay `logsEnable` separado — "¿hay canal?" ya responde "¿están activos?"; un segundo flag solo permitiría un estado contradictorio sin caso de uso real.

`language`/`logsChannel` salen de `GuildConfigCache`, no de consulta propia — `dispatchLog()` es la ruta más transitada del bot. Como `language` vive en `guilds` (PK `id`, no `guild_id`), tiene su propio trigger/función en `drizzle/0000_baseline.sql`, mismo canal `guild_config_changed`.

1. `log.save()` siempre, incondicional.
2. Sin `logsChannel`, corta ahí.
3. Si el envío falla (canal borrado, permiso perdido...), `logsChannel` se limpia — no se reintenta contra un destino roto.
4. Ese fallo genera su propio `ServerEventLog` (`LogsDisabled`) — no se manda a ningún canal, solo queda guardado para que la dashboard pueda mostrarlo después.

## Sin inundar el canal — `LogChannelThrottle`

**Fichero:** [`src/systems/logs/LogChannelThrottle.ts`](../src/systems/logs/LogChannelThrottle.ts)

Un raid genera decenas de `ServerEventLog` en segundos — mandar un mensaje por cada uno reventaría el rate-limit del canal. Límite: `MaxSendsPerWindow` (3) cada `WindowMs` (10s) por servidor; lo que sobra se apila y se manda junto (hasta `MaxEmbedsPerMessage` = 10, límite real de Discord) en cuanto hay hueco. El `Map` interno se limpia solo tras una ventana entera sin pendientes.

**Por qué no vive en Redis (a diferencia de `BurstTracker`/`GuildConfigCache`):** no está en el camino de ninguna decisión de seguridad, solo decide si un mensaje se manda ya o se espera — meterle red no compromete nada, pero hoy tampoco aporta nada (proceso único). Solo tendría sentido con sharding real con estado compartido, o si otro servicio necesitara ver esta cola en vivo.

## Uso desde comando o sistema

Cada comando (`BotActionLog`) o sistema de protección (`ServerEventLog`) declara un `private static log(...)` con un `LogInput` con nombres, despachado sin bloquear:

```ts
void dispatchLog(ctx.client, BanCommand.log({ guildId, targetId, executorId, reason })).catch(() => {});
```

El `void` es intencional: fire-and-forget a propósito, no un `await` olvidado.

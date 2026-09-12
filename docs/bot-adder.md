# Mano dura con quien añade un bot raider — `BotAdderSystem`

**Ficheros:** [`src/systems/bot-adder/BotAdderSystem.ts`](../src/systems/bot-adder/BotAdderSystem.ts), [`src/database/schema/bot-adder.ts`](../src/database/schema/bot-adder.ts), [`src/database/repositories/bot-adder.repository.ts`](../src/database/repositories/bot-adder.repository.ts), [`src/events/guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts), [`src/events/guildMemberRemove.ts`](../src/events/guildMemberRemove.ts)

Cuando un bot se banea por raider (vía [`RaidmodeSystem`](raidmode.md), [`MaliciousMemberSystem`](malicious-members.md) o [`AntiraidSystem`](antiraid.md)), se banea también a quien lo autorizó vía OAuth2 — esa autorización es tan responsable como el raid en sí.

## Por qué no se busca en el audit log de Discord al momento del baneo

1. **Expira** (~45 días) — un bot añadido hace un año no tiene ya entrada que buscar.
2. **No se puede pedir una entrada concreta** — solo paginar hacia atrás por todo el historial, gastando rate limit por algo ni garantizado.

## La solución — capturarlo al momento, no reconstruirlo después

`guildAuditLogEntryCreate.ts` ya escucha toda entrada del audit log. En cuanto pasa un `BOT_ADD`, `BotAdderSystem.track(guildId, botId, executorId)` guarda `(guild, bot) → quién lo añadió` en `bot_adders`, sin depender de que Discord conserve el dato después. **Si no hay fila** (bot añadido antes de esto, o con el proceso caído), se banea solo al bot, sin fallback al audit log — no vale la pena reintroducir esa lentitud por un caso cada vez más raro.

## Por qué no satura la base de datos

`bot_adders` no es un log, es estado mínimo con la misma vida útil que el bot en el servidor: la fila se borra en cuanto el bot se va (`guildMemberRemove.ts`, filtrado a `member.user.bot`). El tamaño queda acotado a "bots presentes ahora mismo" — no crece sin límite. `record()` hace `upsert`: si el bot vuelve a añadirse, solo importa el añadido más reciente.

## Sin excepción de whitelist — a propósito

A diferencia de `AntiraidSystem`, no consulta `guild_configuration.whitelist`: añadir un bot que resulta raider es responsabilidad de quien lo añadió, sea staff o no. Sí se saltan dos casos (fallarían solos igualmente): el ejecutor es el propio bot, o el objetivo es el dueño del servidor (Discord ya bloquea ese ban).

## Los tres puntos de entrada

- **`RaidmodeSystem.enforceJoin`** — bot baneado al unirse con raidmode activo.
- **`MaliciousMemberSystem.enforce`** — rama `Ban` (forzada para bots en la blacklist UBFB).
- **`AntiraidSystem.detect`** — si el ejecutor de la ráfaga es un bot (se confirma con `client.users.fetch`, aquí solo hay `executorId`).

`RaidmodeSystem.enforceAuditEntry` no lo necesita: ya banea directamente a quien añade el bot (tolerancia cero). `AntibotsSystem` tampoco: solo hace kick, nunca ban.

## Logging

`ServerEventType.RaidBotAdderBan`, `data: { botId, source }` (`RaidBotSource.Raidmode | MaliciousMember | Antiraid`) — nadie lo pidió con un comando, así que `ServerEventLog`, no `BotActionLog` (ver [`logs.md`](logs.md)).

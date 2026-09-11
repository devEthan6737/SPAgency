# Mano dura con quien añade un bot raider — `BotAdderSystem`

**Ficheros:** [`src/systems/bot-adder/BotAdderSystem.ts`](../src/systems/bot-adder/BotAdderSystem.ts), [`src/database/schema/bot-adder.ts`](../src/database/schema/bot-adder.ts), [`src/database/repositories/bot-adder.repository.ts`](../src/database/repositories/bot-adder.repository.ts), [`src/events/guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts), [`src/events/guildMemberRemove.ts`](../src/events/guildMemberRemove.ts)

Cuando un bot se banea por raider — vía [`RaidmodeSystem`](raidmode.md), [`MaliciousMemberSystem`](malicious-members.md) o [`AntiraidSystem`](antiraid.md) —, se banea también a quien lo añadió. Un bot no se añade solo: alguien con `Manage Server` lo autorizó vía OAuth2, y si lo que autorizó resultó ser un raider, esa autorización es exactamente igual de responsable que unirse uno mismo a hacer el raid a mano.

## Por qué no se busca en el audit log de Discord en el momento del baneo

La opción obvia — cuando se banea al bot, ir al audit log a buscar su entrada `BOT_ADD` — tiene dos problemas:

1. **El audit log expira** (~45 días según Discord, aunque en la práctica puede notarse antes). Un bot añadido hace un año que nadie recordaba que estaba ahí no tiene ya ninguna entrada que buscar.
2. **Buscar una entrada concreta es lento.** No hay forma de pedirle a la API "dame la entrada `BOT_ADD` de este bot en concreto" — hay que paginar hacia atrás por todo el historial esperando encontrarla, gastando rate limit por algo que ni siquiera está garantizado que exista.

## La solución — capturarlo en el momento, no reconstruirlo después

`guildAuditLogEntryCreate.ts` ya escucha **todas** las entradas del audit log (ver `antiraid.md`, sección 3). En cuanto pasa una de tipo `BOT_ADD`, `BotAdderSystem.track(guildId, botId, executorId)` guarda la pareja `(guild, bot) → quién lo añadió` en `bot_adders` — sin esperar a que haga falta, sin depender de que Discord siga teniendo el dato semanas después. El día que ese bot resulte ser un raider, el dato ya está en nuestra propia base de datos, indefinidamente, sin fecha de caducidad impuesta por Discord.

**Si no hay fila — porque el bot se añadió antes de tener esto, o mientras el proceso estaba caído y se perdió el evento —, se banea solo al bot, sin más.** No hay una segunda búsqueda de respaldo contra el audit log de Discord: eso reintroduciría exactamente la lentitud que se está evitando, por un caso que además es cada vez más raro (todo bot añadido desde que existe esto queda registrado).

## Por qué esto no satura la base de datos

`bot_adders` no es un log — es estado operativo mínimo para poder actuar, con vida útil ligada a la del propio bot en el servidor: la fila se borra en cuanto el bot se va (`guildMemberRemove.ts`, nuevo evento, filtra por `member.user.bot`), porque a partir de ahí ya no hay nada que atribuirle nunca más. Eso acota el tamaño de la tabla a "bots que están ahora mismo en servidores con SPA" — no crece sin límite como sí lo haría cualquier historial (`server_event_logs` incluido). Es justo la comparación que hace que valga la pena guardarlo: a diferencia de un log de auditoría humano, esto es una tabla que se autolimpia y nunca acumula más de lo que hace falta en cada momento.

`BotAdderRepository.record()` hace `upsert` (`onConflictDoUpdate`) por si el mismo bot se vuelve a añadir tras haber sido expulsado — el añadido más reciente es el que importa, no un historial de todas las veces que entró.

## Sin excepción de whitelist — a propósito

A diferencia de `AntiraidSystem`, que exime a `guild_configuration.whitelist` de contar hacia una ráfaga, `BotAdderSystem.enforce()` no consulta la whitelist. Añadir un bot que resulta ser un raider es responsabilidad de quien lo añadió, sea staff de confianza o no — la whitelist existe para no penalizar conducta cotidiana esperada (crear canales, banear gente), no para dar barra libre sobre qué bots se autorizan.

Dos guards sí se mantienen, ambos porque la llamada fallaría sola de todas formas y no vale la pena ni intentarla ni generar un log confuso: el ejecutor es el propio bot (`executorId === client.botId` — puede pasar si SPA mismo gestionó el alta en algún flujo futuro), y Discord ya bloquea banear al dueño del servidor a nivel de API (mismo criterio que `raidmode.md`).

## Los tres puntos de entrada — y por qué no hay un cuarto

- **`RaidmodeSystem.enforceJoin`** — si el que se une con raidmode activo es un bot, se le llama tras el tempban.
- **`MaliciousMemberSystem.enforce`** — en la rama `Ban` (que un bot en la blacklist de UBFB siempre fuerza), tras el ban.
- **`AntiraidSystem.detect`** — si el ejecutor de la ráfaga detectada resulta ser un bot (comprobado con `client.users.fetch`, ya que aquí solo se tiene el `executorId`, no un `GuildMemberStructure` con `.bot` a mano), tras el ban.

**`RaidmodeSystem.enforceAuditEntry` no necesita esto.** Cuando alguien añade un bot con raidmode activo, ese código ya banea directamente a quien lo autorizó (tolerancia cero — ver `raidmode.md`), sin esperar a que el bot llegue a hacer nada. No hay un bot baneado ahí que atribuir; el flujo de `BotAdderSystem` sería redundante.

**`AntibotsSystem` tampoco aplica.** Solo hace *kick*, nunca *ban* — y "mano dura con quien lo añadió" solo tiene sentido cuando el propio bot se confirmó como raider mediante un baneo, no un simple rechazo genérico de "no dejamos entrar bots".

## Logging

Cada baneo del adder registra su propio `ServerEventLog` (`ServerEventType.RaidBotAdderBan`, `data: { botId, source }`, con `source` uno de `RaidBotSource.Raidmode | MaliciousMember | Antiraid`) — el mismo criterio que el resto de acciones automáticas del bot (ver [`logs.md`](logs.md)): nadie lo pidió con un comando, así que es un `ServerEventLog`, no un `BotActionLog`.

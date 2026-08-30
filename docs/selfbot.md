# Selfbots/cuentas falsas — `SelfbotSystem`

**Fichero:** [`src/systems/selfbot/SelfbotSystem.ts`](../src/systems/selfbot/SelfbotSystem.ts) — vive en `guildMemberAdd`, después de `AntibotsSystem` (ver [`antibots.md`](antibots.md)).

Sustituye por completo al `antitokens.js` del legacy, que en la práctica no hacía nada: su condición central usaba una variable (`user`) que nunca se definía en ese scope, así que reventaba con un `ReferenceError` en cada join, silenciado por un `catch` externo. El resto de su lógica (contar joins con un contador genérico, comparar palabras del username entre joins recientes) tampoco encajaba con lo que su propia descripción prometía ("expulsa selfbots/zombies").

## Por qué es una puntuación, no un `if` por señal

A diferencia de `MaliciousMemberSystem` (una blacklist externa confirmada) o `RaidmodeSystem` (un lockdown manual explícito), esto es una heurística: ninguna señal por sí sola prueba que alguien sea un selfbot o una cuenta falsa. Un único `if` por señal dispararía con demasiados falsos positivos (una cuenta nueva y legítima, alguien sin avatar por gusto...). En su lugar, cada señal suma un peso, y solo se actúa si la suma total cruza un umbral — así hace falta una combinación de señales, no una sola coincidencia.

```
NewAccountWeight = 2
DefaultAvatarWeight = 1
SuspiciousNameWeight = 1
JoinBurstWeight = 2
ScoreThreshold = 3
```

Por ejemplo: una cuenta nueva con avatar por defecto (2 + 1 = 3) ya dispara. Un nombre sospechoso por sí solo (1) nunca lo hace.

## Las señales — todas gratis, sin permisos nuevos

- **Antigüedad de cuenta**: `member.user.createdTimestamp` contra `guild_protection.selfbotMinAccountAge` (texto tipo `'30d'`, mismo parseo que `raidmodeTimeToDisable` — ver más abajo). El único umbral configurable por servidor de todo el sistema.
- **Avatar por defecto**: `!member.user.avatar`.
- **Nombre sospechoso**: un regex deliberadamente laxo (`hasSuspiciousName`) que busca el patrón típico de un generador de cuentas en bulk (letras seguidas de una tira larga de dígitos, o un nombre mayoritariamente numérico). Los falsos positivos aquí se asumen y se absorben con el peso más bajo del sistema, no intentando afinar el patrón.
- **Entradas simultáneas**: un contador propio (`isJoinBurst`, `JoinBurstWindowMs` = 10s, `JoinBurstMinCount` = 3) — deliberadamente **no** reutiliza `BurstTracker` (ver `antiraid.md`), porque `BurstTracker.hit()` dispara una vez y resetea el contador, lo que solo marcaría a *una* cuenta de toda una oleada de entradas simultáneas en vez de a todas. Aquí hace falta marcar a cada miembro de la oleada, así que es un contador rodante propio, con el mismo patrón de auto-limpieza (`reapTimer` por guild) que `BurstTracker`/`LogChannelThrottle`.

## Qué se queda fuera — señal de quién invitó

Se planteó también pesar la invitación usada (quién la creó, si es una cuenta de confianza, si tiene un pico de usos anómalo). Se descarta por ahora, no por falta de valor sino por complejidad: Discord no dice qué invitación usó alguien al entrar — hay que cachear todas las invitaciones del servidor, escuchar su creación/borrado, y comparar usos antes/después de cada join para deducir cuál subió. Necesita `MANAGE_GUILD`, tiene casos raros (vanity URL, invitaciones del widget, condiciones de carrera con varios joins a la vez) y es, ella sola, tan compleja como las otras cuatro señales juntas. Queda pendiente de su propia sesión de diseño si algún día se retoma.

## Qué configura el servidor — solo dos campos

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

- **`selfbotAction: SelfbotAction`** (`None | Kick | Ban`, default `None`) — qué hacer si la puntuación cruza el umbral. Mismo patrón que `MaliciousMemberAction`: un enum, no un booleano + un tipo separado.
- **`selfbotMinAccountAge: text`** (default `'30d'` — un mes; sin unidad de mes en el parser, ver abajo) — el único peso individualmente ajustable por servidor, porque es el único con un valor "correcto" que depende del contexto de cada uno (algunos han sufrido raids con cuentas de días, otros con cuentas de minutos). El resto de pesos y el umbral son constantes fijas en código, como `AntiraidSystem.BurstThreshold`/`BurstWindowMs` — no hay una razón real para que cada servidor los ajuste, y exponerlos solo añadiría superficie de configuración sin beneficio demostrado.

**Por qué `Kick` y no `Ban` como acción por defecto:** esto es una heurística, no una confirmación. Un kick es reversible — alguien marcado por error puede volver a entrar sin daño permanente. Un ban por una puntuación equivocada es mucho más difícil de justificar ante el dueño del servidor. `Ban` sigue disponible en el enum para quien quiera máxima agresividad, pero no es lo que se activa por defecto.

## Dónde encaja en `guildMemberAdd.ts`

Corre último, después de `RaidmodeSystem` → `MaliciousMemberSystem` → `AntibotsSystem` (ver [`malicious-members.md`](malicious-members.md) para el porqué de ese orden). Como es la señal más débil de las tres (heurística, no confirmada), no tiene sentido gastarla en alguien que ya se ha ido por una razón más sólida. Para encadenar esto limpio, `AntibotsSystem.enforce()` pasó a devolver `boolean` (si expulsó al bot), igual que ya hacían `MaliciousMemberSystem`/`RaidmodeSystem`:

```ts
if (await RaidmodeSystem.enforceJoin(client, member)) return;
if (await MaliciousMemberSystem.enforce(client, member)) return;
if (await AntibotsSystem.enforce(client, member)) return;

await SelfbotSystem.enforce(client, member);
```

También descarta bots de entrada (`if (member.bot) return false`) — eso es trabajo exclusivo de `AntibotsSystem`, que ya corrió antes.

## Parseo de duración — compartido con raidmode

`selfbotMinAccountAge` usa el mismo parser que `raidmodeTimeToDisable` (`'1d'`/`'30m'`/...). Antes vivía como método `static` en `RaidmodeSystem` porque era el único consumidor además de `RaidmodeExpiry`; con este sistema como segundo consumidor real, se extrajo a [`src/systems/shared/Duration.ts`](../src/systems/shared/Duration.ts) — exactamente el momento que `raidmode.md` ya anticipaba ("si `bloqNewCreatedUsers` acaba necesitando lo mismo, ese es el momento de extraerlo a un sitio compartido — no antes").

## Logging

Siempre que actúa, se loguea con `ServerEventType.SelfbotDetected`, guardando en `data` la acción tomada, la puntuación total y qué señales se dispararon (`{ action, score, signals }`) — no solo "se expulsó a X", sino "por qué", útil si algún día hace falta reajustar los pesos con datos reales (ver [[project_logs_are_security_record]]). Sin puntuación suficiente, no hay log — a diferencia de `MaliciousMemberSystem`, que sí loguea incluso su caso `None` (ahí `None` es una decisión explícita del servidor sobre un hit confirmado; aquí, no cruzar el umbral simplemente significa que no había nada digno de reportar).

Sin DM al dueño del servidor, a diferencia de `MaliciousMemberSystem` — es una heurística con más falsos positivos esperables, y `AntibotsSystem` (con quien comparte más filosofía: automático, sin confirmación externa) tampoco lo hace.

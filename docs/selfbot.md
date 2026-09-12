# Selfbots/cuentas falsas — `SelfbotSystem`

**Fichero:** [`src/systems/selfbot/SelfbotSystem.ts`](../src/systems/selfbot/SelfbotSystem.ts) — vive en `guildMemberAdd`, después de `AntibotsSystem`.

Sustituye a `antitokens.js` del legacy, que no hacía nada real (usaba una variable no definida, reventaba con `ReferenceError` silenciado por un `catch` externo).

## Por qué es una puntuación, no un `if` por señal

A diferencia de `MaliciousMemberSystem` (blacklist confirmada) o `RaidmodeSystem` (lockdown explícito), ninguna señal aquí prueba nada por sí sola. Un `if` por señal dispararía con demasiados falsos positivos. Cada señal suma un peso; solo se actúa si la suma cruza el umbral.

```
NewAccountWeight = 2, DefaultAvatarWeight = 1, SuspiciousNameWeight = 1, JoinBurstWeight = 2
ScoreThreshold = 3
```

Cuenta nueva + avatar por defecto (2+1=3) ya dispara. Nombre sospechoso solo (1) nunca.

## Las señales — todas gratis

- **Antigüedad de cuenta**: `createdTimestamp` vs `selfbotMinAccountAge` (texto `'30d'`, mismo parser que `raidmodeTimeToDisable`). Único umbral configurable por servidor.
- **Avatar por defecto**: `!member.user.avatar`.
- **Nombre sospechoso**: regex laxo (`hasSuspiciousName`) para el patrón típico de generador en bulk. Falsos positivos asumidos, absorbidos con el peso más bajo.
- **Entradas simultáneas**: `isJoinBurst` (`JoinBurstWindowMs`=10s, `JoinBurstMinCount`=3) sobre un [`RollingWindowCounter`](../src/systems/shared/RollingWindowCounter.ts) compartido — no `BurstTracker`, porque ese resetea al disparar (marcaría solo a *una* cuenta de toda una oleada, no a todas). Esta señal originó `RollingWindowCounter` como pieza reutilizable.

## Fuera de alcance — señal de invitación

Se planteó pesar la invitación usada (quién la creó, uso anómalo). Descartado por complejidad, no por falta de valor: Discord no dice qué invite usó alguien al entrar — hay que cachear todas, escuchar creación/borrado, comparar usos antes/después. Necesita `MANAGE_GUILD` y tiene varios casos raros (vanity URL, widget, condiciones de carrera). Pendiente de sesión de diseño propia si se retoma.

## Configuración — solo dos campos

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

- **`selfbotAction`** (`None | Kick | Ban`, default `None`).
- **`selfbotMinAccountAge`** (default `'30d'`) — único peso ajustable por servidor, porque es el único sin un valor "correcto" universal. El resto son constantes fijas, como `AntiraidSystem.BurstThreshold`.

**`Kick` por defecto, no `Ban`**: es una heurística, no una confirmación. Un kick es reversible; un ban por puntuación equivocada es difícil de justificar. `Ban` sigue disponible para quien quiera máxima agresividad.

## Dónde encaja en `guildMemberAdd.ts`

Corre último (tras `RaidmodeSystem` → `MaliciousMemberSystem` → `AntibotsSystem`) — es la señal más débil, no vale la pena gastarla en alguien ya expulsado por razón más sólida.

```ts
if (await RaidmodeSystem.enforceJoin(client, member)) return;
if (await MaliciousMemberSystem.enforce(client, member)) return;
if (await AntibotsSystem.enforce(client, member)) return;
await SelfbotSystem.enforce(client, member);
```

Descarta bots de entrada (`if (member.bot) return false`) — eso ya lo cubrió `AntibotsSystem`.

## Parseo de duración

Comparte parser con `raidmodeTimeToDisable` — extraído a [`src/systems/shared/Duration.ts`](../src/systems/shared/Duration.ts) en cuanto este fue el segundo consumidor real (antes vivía en `RaidmodeSystem`).

## Logging

`ServerEventType.SelfbotDetected` con `data: { action, score, signals }` — no solo "se expulsó a X" sino "por qué", útil para reajustar pesos con datos reales. Sin puntuación suficiente, no hay log (a diferencia de `MaliciousMemberSystem`, que loguea incluso `None` porque ahí es una decisión explícita sobre un hit confirmado). Sin DM al owner — heurística con más falsos positivos esperables, mismo criterio que `AntibotsSystem`.

# Raidmode — `RaidmodeSystem`

Bloqueo manual: el dueño lo activa porque ya sabe que hay un problema. Cero umbral, cero beneficio de la duda salvo el mínimo indispensable. **Fichero:** [`src/systems/raidmode/RaidmodeSystem.ts`](../src/systems/raidmode/RaidmodeSystem.ts).

## Filosofía

Antiraid/antibots funcionan siempre en segundo plano con mínimos falsos positivos (antiraid exige ráfaga de 3, antibots deja pasar verificados). Raidmode es lo contrario porque es una decisión humana explícita:

1. **Cero umbral** — una sola acción sospechosa basta.
2. **Sustituye, no complementa** — mientras está activo, reemplaza a antiraid/antibots/`MaliciousMemberSystem`/logging normal para esa acción, no corren en paralelo.

## Excepciones — solo dos

- **El dueño del servidor** — Discord ya bloquea banearlo, pero se comprueba explícitamente para no gastar una llamada condenada a fallar ni generar un log confuso.
- **El propio bot** — igual que `AntiraidSystem`: sin esto, restaurar un backup se autobanearía.

**Sin whitelist, a propósito.** Es una puerta que alguien podría abrir con ingeniería social o un token robado — durante un lockdown, se cierra también.

## Qué pasa en cada disparador

Mismos dos puntos de entrada que ya existen (`guildMemberAdd.ts`, `guildAuditLogEntryCreate.ts`), con raidmode comprobándose primero y cortando con `return` si actúa.

- **Alguien se une** (humano o bot, igual): baneo **temporal** con la duración de `raidmodeTimeToDisable`, vía el sistema de `tempban` ya existente. Si es un bot, hay trato extra — ver [`bot-adder.md`](bot-adder.md).
- **Crear/borrar canal o rol, banear/desbanear** (mismo set que vigila `AntiraidSystem`): baneo **permanente** al ejecutor — ya es una acción con permisos reales detrás.
- **Añadir un bot** (`BotAdd`): baneo permanente a quien lo autorizó (el bot en sí ya recibe su tempban al entrar como miembro). A diferencia del antiraid normal (donde esto no cuenta, por ser configuración habitual), aquí el umbral cero ya asume que todo es sospechoso. Como esto ya banea al adder directamente, `BotAdderSystem` no interviene aquí — solo en el punto anterior.

Sin DM al owner (ya sabe que hay un problema — sería ruido). Todo se registra como `ServerEventLog`; `LogChannelThrottle` evita que el canal se sature aunque lleguen muchos de golpe.

## Descartado

- **Contraseña propia (`raidmodePassword`)**: se pensó reutilizar el 2FA general (`guild_configuration.passwordEnable`/`password`), pero ese 2FA nunca se implementó (atado a comandos de prefijo del legacy, no portado a slash commands, columnas eliminadas). Hoy activar/desactivar raidmode es un simple toggle vía dashboard, sin contraseña.
- **Activación/duración**: config pura → dashboard, no comando de Seyfert.

## Parseo de duración — `Duration.ts`

`raidmodeTimeToDisable` (`'1d'`/`'30m'`) usa el mismo parser que `selfbotMinAccountAge` (ver [`selfbot.md`](selfbot.md)): regex propio (`/^(\d+)\s*(s|m|h|d|w)$/i`) en [`src/systems/shared/Duration.ts`](../src/systems/shared/Duration.ts) en vez de instalar `ms` — default de 1 día si no matchea. Extraído de `RaidmodeSystem` a un módulo compartido en cuanto `SelfbotSystem` lo necesitó también.

## Auto-desactivación — `RaidmodeExpiry`

**Fichero:** [`src/systems/raidmode/RaidmodeExpiry.ts`](../src/systems/raidmode/RaidmodeExpiry.ts)

Deliberadamente no es un poller tipo `tempban` (raidmode está activo en un puñado de servidores como mucho — barrer la tabla entera desperdiciaría ciclos). En su lugar, un `setTimeout` por servidor vía [`ExpiringMap`](../src/systems/shared/ExpiringMap.ts):

- Un segundo `LISTEN` en el mismo canal `guild_config_changed` que `GuildConfigCache` — reprograma/limpia el temporizador del servidor en cada cambio de config.
- Una pasada en `ready` (cada sesión de gateway nueva) para cubrir huecos de desconexión.
- Al vencer, desactiva y loguea (`RaidmodeExpired`); el `UPDATE` resultante redispara el mismo trigger pero `reschedule()` no hace nada si ya está `false`, sin bucle.

Con 2-3 servidores activos a la vez, esto es unos pocos timers en memoria, cero polling.

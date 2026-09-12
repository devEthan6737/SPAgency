# Antibots — `AntibotsSystem`

Sistema hermano del antiraid (misma caché de config, mismo patrón de logging — ver [`antiraid.md`](antiraid.md)), pero protege el join de un bot, no una ráfaga de acciones.

## Filosofía

Un bot actúa en cuanto entra, con todos los permisos que le den, sin esperar invitación. Por eso: (1) se bloquea en el propio join, nunca "detectar y luego actuar"; (2) la verificación de Discord (`VerifiedBot`) es la señal por defecto — pasó una revisión externa que un bot casero/malicioso no puede falsificar.

## `AntibotsSystem.enforce(client, member)`

**Ficheros:** [`src/systems/antibots/AntibotsSystem.ts`](../src/systems/antibots/AntibotsSystem.ts), [`src/events/guildMemberAdd.ts`](../src/events/guildMemberAdd.ts)

Se llama desde `guildMemberAdd`, después de `MaliciousMemberSystem.enforce()` (ver [`malicious-members.md`](malicious-members.md)) — se salta si ese ya baneó al que entra (un bot malicioso conocido debe acabar baneado, no solo expulsado).

1. Si no es un bot, o `antibotsEnable` está desactivado (vía `GuildConfigCache`, sin red), no hace nada.
2. Si el modo es `OnlyUnverified` y el bot está verificado, lo deja pasar.
3. Si no, `client.members.kick()` + log.

## `AntibotsType` — solo dos modos

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

- **`All`**: expulsa cualquier bot.
- **`OnlyUnverified`**: expulsa solo los no revisados por Discord.

El legacy tenía un tercer modo (`only_v`) que hacía justo lo contrario de lo sensato — expulsaba a los verificados y dejaba pasar a los no verificados. No se portó: era un bug de diseño, no una feature.

La verificación se lee de `UserFlags.VerifiedBot` sobre `member.user.publicFlags` — ya viene en el payload del evento, cero peticiones.

## Logging

Un kick de antibots es una acción que el bot decide por su cuenta (nadie la pidió con un comando) → `ServerEventLog` (`AntibotsKick`), nunca `BotActionLog`. Ver [`logs.md`](logs.md).

## Notas

`guildMemberAdd` es punto de entrada único (Seyfert solo permite un handler por evento) — cualquier sistema de join futuro se añade ahí. `AntibotsSystem.enforce()` devuelve `boolean` para que `guildMemberAdd.ts` se salte `SelfbotSystem` si ya no queda a quién puntuar.

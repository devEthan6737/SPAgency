# Antibots — filosofía y sistema

Sistema hermano del antiraid (ver [`antiraid.md`](antiraid.md)): comparte su misma caché de config y el mismo patrón de logging, pero protege un momento distinto — no una ráfaga de acciones, sino la propia entrada de un bot al servidor.

## Filosofía

Un bot añadido a un servidor tiene, por defecto, todos los permisos que le den — y a diferencia de un usuario, puede actuar en cuanto entra, sin esperar a que nadie lo invite a hacer nada. Dos ideas gobiernan el diseño:

1. **Bloquear en el propio join, no después.** No hay "detectar y luego actuar" — si el bot que entra no cumple la regla configurada, se expulsa en el mismo evento, antes de que tenga ocasión de hacer nada.
2. **La verificación de Discord es la señal, no la excusa.** Un bot verificado por Discord pasó una revisión externa; uno sin verificar no pasó ninguna. El modo por defecto sensato es fijarse solo en eso.

## El sistema — `AntibotsSystem`

**Ficheros:** [`src/systems/antibots/AntibotsSystem.ts`](../src/systems/antibots/AntibotsSystem.ts), [`src/events/guildMemberAdd.ts`](../src/events/guildMemberAdd.ts)

`AntibotsSystem.enforce(client, member)` se llama desde `guildMemberAdd` — el evento de gateway que dispara Discord por cada nuevo miembro, humano o bot. **No es lo primero que corre**: `guildMemberAdd.ts` llama antes a `MaliciousMemberSystem.enforce()` (ver [`malicious-members.md`](malicious-members.md)) y se salta `AntibotsSystem` por completo si ese ya baneó al que se une — un bot malicioso conocido debe acabar baneado, no solo expulsado, así que no tiene sentido que antibots llegue a actuar sobre alguien que ya no está.

Cuando sí corre, la lógica es lineal:

1. Si quien entra no es un bot, no hay nada que hacer.
2. Si `antibotsEnable` está desactivado (vía `GuildConfigCache`, sin red — ver `antiraid.md` sección 2), no hay nada que hacer.
3. Si el modo es `AntibotsType.OnlyUnverified` y el bot **sí** está verificado, se le deja pasar.
4. En cualquier otro caso, se expulsa con `client.members.kick()` y se registra el log.

## Los modos — `AntibotsType`

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

Solo dos, a propósito:

- **`All`**: expulsa cualquier bot que se una. Máxima seguridad, cero excepciones.
- **`OnlyUnverified`**: expulsa solo los que Discord no ha revisado — el riesgo real, ya que un bot verificado pasó un proceso de revisión externo que un bot casero/malicioso no puede falsificar.

El legacy tenía un tercer modo, `only_v`, que expulsaba **solo** a los bots verificados y dejaba pasar a los no verificados — literalmente al revés de lo que tiene sentido para seguridad. No se portó: mantenerlo habría sido reproducir un bug de diseño del bot anterior, no una funcionalidad.

La verificación se comprueba con el flag público de Discord (`UserFlags.VerifiedBot`, bit `65536`) sobre `member.user.publicFlags` — sin ninguna petición a la API, el dato ya viene en el propio payload del evento.

## Logging

Igual que la detección de ráfagas del antiraid, un kick de antibots es una acción que el bot toma **por su cuenta**, sin que nadie la pidiera con un comando — así que se registra como `ServerEventLog` (tipo `AntibotsKick`), no como `BotActionLog`. El porqué de esa distinción está en [`logs.md`](logs.md).

## Lo que falta

`guildMemberAdd` es, igual que `guildAuditLogEntryCreate`, un único punto de entrada por la misma restricción de Seyfert (un handler por evento) — cualquier sistema futuro que reaccione a un join (antijoins, verification, bloqEntritiesByName, bloqNewCreatedUsers) se añade ahí, no en un fichero aparte. Ninguno de esos está implementado todavía (`antibots` y `maliciousMemberAction` sí lo están, ver [`malicious-members.md`](malicious-members.md) para el segundo).

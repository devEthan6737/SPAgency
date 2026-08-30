# Miembros maliciosos — diseño (sin implementar)

Qué hace el bot cuando un usuario marcado como malicioso en UBFB (la blacklist global, ver `src/systems/ubfb/`) se une al servidor. **Diseñado y documentado, pero todavía sin código** — vive en `guildMemberAdd`, el mismo evento donde ya está `AntibotsSystem` (ver [`antibots.md`](antibots.md)), y es de las piezas pendientes del bundle de protección al unirse.

## El campo — `MaliciousMemberAction`

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

Un único enum (`None | Mark | Ban`) en vez de los dos booleanos independientes que tenía el legacy (`markMaliciousEnable` + `kickMaliciousEnable`), que podían activarse los dos a la vez sin que eso significara nada coherente — "déjalo entrar pero márcalo" y "no lo dejes entrar" son resultados que se excluyen mutuamente, así que se modelan como un solo campo con tres estados, no como dos flags que hay que mantener sincronizados a mano.

`warnEntry` (booleano aparte) es ortogonal a este campo: es un "avísame" que funciona igual de bien acompañando a cualquiera de los tres casos.

## Qué pasa en cada caso

Dos cosas ocurren **siempre**, sea cual sea el valor de `maliciousMemberAction`, así que no se repiten en cada caso:
- El join se registra igual (un `ServerEventLog`, automático, no depende de esta config — mismo criterio que el resto de acciones automáticas del bot, ver [`logs.md`](logs.md)).
- Si `warnEntry` está activo, se avisa al dueño del servidor por privado.

Lo que cambia entre casos es solo esto:

- **`None`**: nada más. El usuario entra como cualquier otro.
- **`Mark`**: le cambia el apodo al motivo por el que está marcado como malicioso. Sin más configuración — no hay tipo que elegir. Si el bot no tiene permiso de gestionar apodos, o el usuario está por encima en jerarquía, esto se salta en silencio (el log y el DM al owner siguen ocurriendo igual).
- **`Ban`**: banea directamente. **No es un kick, a propósito** — un kick deja la puerta abierta a que el usuario vuelva a intentar entrar de inmediato, y dejar que eso se repita sin límite abre una ventana de carrera en el propio manejo del evento de join que, con mala suerte, podría acabar dejándolo entrar sin que el sistema se entere. Banear de una quita ese riesgo del todo — no hay una escalera kick→ban que haya que acertar, es una sola acción que funciona a la primera.

## Por qué se podó de 4 variantes a 3 (y `Mark` a 1 sola acción)

El legacy `markmalicious.js` tenía 4 variantes configurables para el caso "marcar": cambiar apodo, añadir un rol, mandar log al canal, o avisar al owner por privado. De esas, solo el cambio de apodo sobrevive como comportamiento real de `Mark`:

- **Avisar al owner** ya lo cubre `warnEntry`, que además ahora es independiente del tipo de acción — no hace falta que sea una variante de `Mark`.
- **Mandar log al canal** ya pasa siempre, automáticamente, para las tres acciones — no es algo que dependa de configurar `Mark`.
- **Añadir un rol** nunca llegó a usarse de verdad en el bot legacy — se descartó sin más, no reproducir un feature muerto solo por que existiera antes.

Con esas tres fuera, a `Mark` no le queda nada que configurar — siempre cambia el apodo, sin un campo `markMaliciousType` que mantener.

## Lo que falta

Todo esto vive solo en el schema por ahora — no hay ningún `MaliciousMemberSystem` ni hook en `guildMemberAdd` todavía. Cuando le toque su sesión de diseño, tendrá que resolver como mínimo: cómo se consulta la blacklist de UBFB desde el evento de join (¿caché local, o llamada directa a su API?), y cómo encaja con el resto del bundle de protección al unirse (`antitokens`, `antijoins`, `verification`, `bloqEntritiesByName`, `bloqNewCreatedUsers`) que se ejecuta en el mismo evento.

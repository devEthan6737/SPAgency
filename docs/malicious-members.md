# Miembros maliciosos — `MaliciousMemberSystem`

Qué hace el bot cuando un usuario marcado como malicioso en UBFB (la blacklist global, ver `src/systems/ubfb/`) se une al servidor. **Fichero:** [`src/systems/malicious-members/MaliciousMemberSystem.ts`](../src/systems/malicious-members/MaliciousMemberSystem.ts) — vive en `guildMemberAdd`, junto a `AntibotsSystem` (ver [`antibots.md`](antibots.md)).

## El campo — `MaliciousMemberAction`

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

Un único enum (`None | Mark | Ban`) en vez de los dos booleanos independientes que tenía el legacy (`markMaliciousEnable` + `kickMaliciousEnable`), que podían activarse los dos a la vez sin que eso significara nada coherente — "déjalo entrar pero márcalo" y "no lo dejes entrar" son resultados que se excluyen mutuamente, así que se modelan como un solo campo con tres estados, no como dos flags que hay que mantener sincronizados a mano.

No hay un `warnEntry` aparte. El aviso al dueño del servidor no es una opción que haya que activar — pasa solo cuando la acción es `Mark` o `Ban`, porque no existe ningún motivo para elegir cualquiera de las dos y *no* querer enterarte. Un booleano aparte para eso solo sería otro flag redundante que mantener sincronizado con el enum, igual que pasaba antes con `markMaliciousEnable`/`kickMaliciousEnable`.

## Qué pasa en cada caso

Una cosa ocurre **siempre**, incluso con `None`: el join se registra igual (un `ServerEventLog`, automático, no depende de esta config — mismo criterio que el resto de acciones automáticas del bot, ver [`logs.md`](logs.md)).

- **`None`**: nada más. El usuario entra como cualquier otro, sin aviso al owner.
- **`Mark`**: avisa al dueño del servidor por privado y le cambia el apodo al motivo por el que está marcado como malicioso. Sin más configuración — no hay tipo que elegir. Si el bot no tiene permiso de gestionar apodos, o el usuario está por encima en jerarquía, el cambio de apodo se salta en silencio (el log y el DM al owner siguen ocurriendo igual).
- **`Ban`**: avisa al dueño del servidor por privado y banea directamente. **No es un kick, a propósito** — un kick deja la puerta abierta a que el usuario vuelva a intentar entrar de inmediato, y dejar que eso se repita sin límite abre una ventana de carrera en el propio manejo del evento de join que, con mala suerte, podría acabar dejándolo entrar sin que el sistema se entere. Banear de una quita ese riesgo del todo — no hay una escalera kick→ban que haya que acertar, es una sola acción que funciona a la primera.

**Excepción que ignora la config por completo: un bot malicioso siempre se banea.** Si el que se une está a la vez en la blacklist de UBFB y es un bot, `maliciousMemberAction` ni se consulta — se fuerza `Ban` sin importar si el servidor tiene `None` o `Mark` configurado. No hay ningún motivo legítimo para "marcar y dejar entrar" o "no hacer nada" con un bot que además de estar en la blacklist global, ha conseguido colarse más allá de `AntibotsSystem`.

## Por qué se podó de 4 variantes a 3 (y `Mark` a 1 sola acción)

El legacy `markmalicious.js` tenía 4 variantes configurables para el caso "marcar": cambiar apodo, añadir un rol, mandar log al canal, o avisar al owner por privado. De esas, solo el cambio de apodo sobrevive como configuración real de `Mark` (el aviso al owner pasó a ser incondicional para `Mark`/`Ban`, no algo que dependa de elegir esa variante):

- **Avisar al owner** ya no es una variante de nada — es incondicional para `Mark`/`Ban`, como se explica arriba.
- **Mandar log al canal** ya pasa siempre, automáticamente, para las tres acciones — no es algo que dependa de configurar `Mark`.
- **Añadir un rol** nunca llegó a usarse de verdad en el bot legacy — se descartó sin más, no reproducir un feature muerto solo por que existiera antes.

Con esas tres fuera, a `Mark` no le queda nada que configurar — siempre cambia el apodo, sin un campo `markMaliciousType` que mantener.

## Cómo se consulta la blacklist — sin red en el caso común

`getUbfb().isBlacklisted(userId)` es la primera comprobación, y es local — la caché de UBFB se mantiene sincronizada por WebSocket (`sync`/`add`/`remove`), así que el 99.9% de los joins (gente que no está en ninguna blacklist) no toca la red en absoluto. Solo cuando un usuario **sí** está marcado se intenta conseguir el detalle completo (el motivo): primero de la propia caché (`getCachedEntry`), y si no está cacheado — puede pasar, un `sync` por WebSocket solo trae IDs, no el registro completo — se hace una única llamada REST (`getBlacklistEntry`) para ese usuario en concreto. A diferencia del antiraid, aquí una petición puntual no es un problema: no hay ráfaga que proteger, es un evento que ya de por sí es raro (alguien de la blacklist global uniéndose a este servidor en concreto).

## Qué falta del bundle completo

`MaliciousMemberSystem` es solo una pieza del bundle de protección al unirse. El resto (`antitokens`, `antijoins`, `verification`, `bloqEntritiesByName`, `bloqNewCreatedUsers`) sigue sin implementar, pendiente de su propia sesión de diseño — cada uno se añade a `guildMemberAdd.ts` según le toque, nunca en un fichero de evento aparte.

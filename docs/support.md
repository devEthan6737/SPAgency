# Soporte — tickets web ↔ Discord — `SupportSystem` / `SupportApi`

**Ficheros:** [`src/systems/support/`](../src/systems/support/) (`SupportApi.ts`, `SupportSystem.ts`, `SupportTicketIndex.ts`, `SupportTicket.ts`, `SupportMessages.ts`, `SupportMessageBuffer.ts`, `SupportHistory.ts`, `SupportPosts.ts`, `SupportConfig.ts`), [`src/events/ready.ts`](../src/events/ready.ts), [`src/events/messageCreate.ts`](../src/events/messageCreate.ts)

El usuario abre un ticket desde la web, el ticket es un canal del servidor de soporte, el staff responde en Discord y el usuario desde la web. Este doc cubre **el lado del bot**; el contrato completo (rutas, cuerpos, códigos, transcript) vive en `docs/support.md` del repo de la web (`SPA-Website`) y es la fuente de verdad — aquí solo lo que el bot decide por su cuenta.

> **Estado:** implementado crear y listar tickets, y los mensajes en ambos sentidos. Pendiente: cierre y transcript, botón **Cerrar ticket** y `channelDelete` (ver [Pendiente](#pendiente)).

## El canal es el ticket — sin base de datos

Nada se guarda fuera de Discord. `SupportTicketChannel` codifica y decodifica el ticket:

- **Tema (una sola escritura, al crear):** `ticket:<ticketId> user:<userId>` y, en la segunda línea, el asunto. Discord limita las ediciones de tema y nombre a 2 cada 10 min, por eso el tema no se vuelve a tocar. Un canal de la categoría cuyo tema no encaje simplemente no es un ticket.
- **Nombre:** `ticket-<6 primeros caracteres del id>`; pasa a `cerrando-<…>` al empezar el cierre, y esa es la marca que permite retomar un cierre tras reiniciar. Discord pasa los nombres a minúsculas, así que el estado se lee por prefijo, nunca comparando el nombre entero.
- **Fecha de apertura:** sale del snowflake del canal.
- **`ticketId`:** 16 bytes de `crypto.randomBytes` en base64url (22 caracteres). Opaco: no se puede adivinar ni enumerar.

## `SupportTicketIndex` — el índice en memoria

Mapa `ticketId → ticket` y `channelId → ticketId`, para que ni cada mensaje del servidor de soporte ni cada consulta de la web toquen la red.

- **Se reconstruye en cada sesión nueva del gateway** (no solo en la primera): un canal borrado mientras el bot estaba caído nunca dispara `channelDelete`.
- **Por REST, no por caché** (`guilds.channels.list(guildId, true)`): `ready` se dispara con el READY del gateway, antes de que lleguen los canales de los servidores, así que la caché puede estar vacía.
- **Sin carrera:** un ticket creado mientras la lista estaba en vuelo se conserva en la reconstrucción; si no, su dueño podría abrir un segundo ticket.
- **Hasta que termina la primera reconstrucción, la API responde `503 support_unavailable`.** `SupportSystem.start` la reintenta a los 0, 5 y 30 s si Discord falla.

## Crear un ticket — `SupportSystem.create`

Orden de comprobaciones, cada una con su código (los del contrato de la web):

1. Ya tiene un ticket, **cerrándose incluido**, o se está creando uno ahora mismo → `429 too_many_open_tickets`. El bloqueo por usuario (`creating`) convierte dos clics rápidos en un ticket, no dos.
2. Creó otro hace menos de 60 s → `429 cooldown` (`ExpiringMap`, en memoria).
3. La categoría ya tiene 50 canales → `503 support_full`. Es el tope de Discord; se comprueba con el tamaño del índice y, por si la categoría tiene más canales que tickets, también reconociendo el error de Discord (`Maximum number of channels…`).
4. Cualquier otro fallo de Discord → `502 ticket_creation_failed`.

Después: canal con sus permisos, mensaje informativo (asunto, quién lo abrió, botón **Cerrar ticket**) y **el primer mensaje del usuario** como embed aparte. Si falla la publicación, **el canal se borra** — no queda un ticket a medias.

**Permisos del canal:** `@everyone` sin ver; staff (`SUPPORT_STAFF_ROLE_ID`) ver, escribir, historial y adjuntar; bot lo mismo más enlaces y `ManageChannels` (para poder renombrar y borrar el canal cuando el cierre lo bloquee). El usuario nunca entra: su interfaz es la web.

**Validación (`SupportApi.parseCreateBody`):** el asunto se colapsa a una línea (va al tema, cuya segunda línea *es* el asunto), `username` se recorta a 80 caracteres y un `avatarUrl` que no sea `https:` se descarta en vez de rechazar la petición — Discord rechazaría el embed entero por un icono inválido.

## Los mensajes del ticket — `SupportMessages`

`SupportMessages.normalize` convierte cada mensaje del canal en `{ id, author, name, avatar, content, at }` o lo descarta:

| Mensaje | Resultado |
| :------ | :-------- |
| Miembro con el rol de staff | `staff` |
| … y empieza por `//` | `note` — nunca sale hacia la web; solo irá en la copia del staff |
| Embed del propio bot con footer `web` | `user` (nombre y avatar del embed) |
| Otros bots, webhooks, mensajes de sistema, el mensaje informativo, gente sin el rol, mensajes vacíos | se ignoran |

- **El rol del staff** se lee de `message.member.roles.keys` cuando el mensaje llega en vivo. Uno leído del historial no trae miembro, así que se pide (caché primero); quien ya no está en el servidor deja de contar como staff.
- **Texto legible**, porque la web no resuelve ids: `<@id>` → `@nombre` (de `message.mentions`), `<@&id>` → `@rol`, `<#id>` → `#canal`, `<:nombre:id>` → `:nombre:`. Los roles y canales solo se consultan si el texto los menciona, y los nombres de rol —la caché de roles está desactivada— se guardan 5 min. Sin resolver, quedan `@usuario`, `@rol` y `#canal`.
- **Adjuntos:** no se reflejan; se añade `[archivo adjunto no disponible en la web]`. Un mensaje solo con archivo se envía únicamente con ese marcador.
- **Los mensajes del usuario no se convierten:** son lo que escribió en la web, y el transcript tiene que coincidir con lo que vio. Solo se deshace el espacio de ancho cero que neutralizó `@everyone`.

### Búfer y lectura — `SupportMessageBuffer`

Cada ticket tiene un búfer de sus últimos 200 mensajes visibles para la web, para que el *polling* (cada ~3 s por ticket abierto) no toque Discord.

- **Se llena en la primera lectura** de un ticket (también tras un reinicio), leyendo los últimos 200 del canal, y a partir de ahí lo mantiene al día `messageCreate`. Un ticket que nadie ha leído no tiene búfer: su primera lectura ya encontrará esos mensajes en el canal.
- **`floor`:** el búfer es completo para todo mensaje *posterior* a ese id (`'0'` si se leyó el canal entero). Un cursor `after` ≥ `floor` se sirve de memoria; uno más antiguo, o sin cursor en un canal de más de 200 mensajes, se lee del historial de Discord (`SupportHistory.after`), que pagina hasta juntar 50 visibles.
- **Sin carreras:** los mensajes en vivo que llegan mientras la primera lectura está en vuelo se guardan y se fusionan después, sin duplicados; dos primeras lecturas simultáneas comparten una sola.
- **Los ids se comparan como texto** (longitud y luego orden léxico), no con `BigInt`: es equivalente para snowflakes y evita convertir en cada mensaje.

### Rutas

- **`GET /support/tickets/:ticketId/messages?userId=&after=`** — máximo 50, ascendentes. `404` si el ticket no existe **o no es del usuario** (indistinguibles a propósito), `400` si `userId` o `after` no son válidos. Un ticket `closing` sigue respondiendo `200`.
- **`POST /support/tickets/:ticketId/messages`** — `{ userId, content }`, `content` ≤ 2000. `200 { id }`, `400`, `404`, `429 cooldown` (más de un mensaje cada 2 s por usuario; se anota *antes* de escribir, para que una ráfaga no lo esquive). La web solo manda el `userId`, así que el nombre y el avatar del embed se piden a Discord (caché primero); si falla, sale con un nombre genérico.
- **`409 closing`** — el ticket ya se está cerrando. El contrato no lo define: un `404` mandaría al usuario a un transcript que la web aún no tiene, y la web muestra cualquier código desconocido como un error genérico. `502 send_failed` si Discord rechaza el mensaje.

### Automod

`messageCreate.ts` pregunta primero si el canal es un ticket (`SupportSystem.isTicketChannel`, una búsqueda en el índice): si lo es, el mensaje va solo al búfer y **no llega al automod ni al rastreo de ghostpings** — el staff no es un bot, y de otro modo se le sancionaría por mayúsculas o enlaces dentro de un ticket.

## Los mensajes del usuario — `SupportPosts`

Se publican como **embed** con su nombre y avatar y el footer `web`, con `allowed_mentions: { parse: [] }` y `@everyone`/`@here` neutralizados con un espacio de ancho cero: nada de lo que escriba puede mencionar a nadie. El footer `web` es la marca con la que el normalizador reconocerá luego un mensaje del bot como del usuario (los demás mensajes del bot se ignoran).

Los textos van en español fijo (`client.t('es')`, es un servidor de staff); las claves están en `systems.support`.

## Configuración

Todo por variables de entorno (en desarrollo se cargan del `.env` vía `dotenv`; ver `.env.example`):

| Variable | Para qué |
| :------- | :------- |
| `INTERNAL_API_KEY` | clave compartida con la web, en ambos sentidos: la web contra `/support/*` y el bot contra la web al empujar transcripts |
| `WEB_URL` | base de la web, para esas llamadas del bot |
| `SUPPORT_GUILD_ID`, `SUPPORT_CATEGORY_ID` | dónde viven los tickets |
| `SUPPORT_STAFF_ROLE_ID` | rol que ve y responde |
| `STAFF_LOGS_CHANNEL` | canal del staff: copias de los transcripts y avisos cuando la web no confirma uno. Es el mismo de las altas/bajas del bot y el SOS, no uno propio |

**Si falta cualquiera, el soporte queda desactivado**: aviso en el arranque (`[support] Disabled — missing …`) y `503 support_unavailable` en las rutas — nunca un fallo al arrancar. `INTERNAL_API_KEY`, `WEB_URL` y `STAFF_LOGS_CHANNEL` cuentan como requeridas aunque todavía no se usen (sin ellas no se podría entregar ni archivar un transcript), para no aceptar tickets que luego no se podrían cerrar. `STAFF_LOGS_CHANNEL` es opcional para el resto del bot, pero aquí es obligatoria. La comprobación de la clave va antes que la de configuración: quien no está autenticado no puede saber si el soporte está activo.

**Permisos del bot en la categoría:** ver canales, gestionar canales, enviar mensajes, insertar enlaces, adjuntar archivos y leer el historial. Los overwrites del canal solo se aceptan si el bot ya tiene esos permisos.

## Decisiones de diseño

- **Un ticket en cierre sigue existiendo para la web** hasta que ésta confirma el transcript: `GET …/messages` seguirá respondiendo `200` (sin mensajes nuevos) y solo pasará a `404` después. Un `404` inmediato haría que la web llevara al usuario a un historial que todavía no existe.
- **El antiraid no se dispara** al crear y borrar canales de tickets, porque ignora al propio bot como ejecutor ([`AntiraidSystem.ts:41`](../src/systems/antiraid/AntiraidSystem.ts)).
- **Intents:** ya están `GuildMessages` y `MessageContent`; no hay nada que tocar en el Developer Portal.

## Pendiente

- **Cierre:** bloqueo y marca `cerrando-…`, historial completo, transcript en dos versiones, empuje a la web con reintentos (5 s, 30 s, 5 min, 30 min), copia al canal del staff, DM de mejor esfuerzo y borrado. Si la web falla, el canal queda bloqueado, se sube igualmente la copia del staff y se avisa en `STAFF_LOGS_CHANNEL`; un `4xx` de la web no se reintenta. Al arrancar se retoman los canales `cerrando-…`.
- **Botón `support-close`:** `ComponentCommand` (hay que añadir `components` a `locations` en `seyfert.config.mjs`), solo para el staff, comprobando `ctx.member.roles.keys` de la interacción. El `customId` no lleva el ticket: se resuelve por el canal donde se pulsa.
- **`channelDelete.ts`** (no existe aún): quitar del índice un ticket cuyo canal se borre a mano.

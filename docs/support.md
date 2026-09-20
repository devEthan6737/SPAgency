# Soporte — tickets web ↔ Discord — `SupportSystem` / `SupportApi`

**Ficheros:** [`src/systems/support/`](../src/systems/support/) (`SupportApi.ts`, `SupportSystem.ts`, `SupportTicketIndex.ts`, `SupportTicket.ts`, `SupportPosts.ts`, `SupportConfig.ts`), [`src/events/ready.ts`](../src/events/ready.ts)

El usuario abre un ticket desde la web, el ticket es un canal del servidor de soporte, el staff responde en Discord y el usuario desde la web. Este doc cubre **el lado del bot**; el contrato completo (rutas, cuerpos, códigos, transcript) vive en `docs/support.md` del repo de la web (`SPA-Website`) y es la fuente de verdad — aquí solo lo que el bot decide por su cuenta.

> **Estado:** implementado crear y listar tickets. Pendiente: mensajes (`GET`/`POST …/messages`), cierre y transcript, botón **Cerrar ticket**, exclusión del automod y `channelDelete` (ver [Pendiente](#pendiente)).

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

## Los mensajes del usuario — `SupportPosts`

Se publican como **embed** con su nombre y avatar y el footer `web`, con `allowed_mentions: { parse: [] }` y `@everyone`/`@here` neutralizados con un espacio de ancho cero: nada de lo que escriba puede mencionar a nadie. El footer `web` es la marca con la que el normalizador reconocerá luego un mensaje del bot como del usuario (los demás mensajes del bot se ignoran).

Los textos van en español fijo (`client.t('es')`, es un servidor de staff); las claves están en `systems.support`.

## Configuración

Todo por variables de entorno (en desarrollo se cargan del `.env` vía `dotenv`; ver `.env.example`):

| Variable | Para qué |
| :------- | :------- |
| `SUPPORT_API_KEY` | autentica a la web contra `/support/*` |
| `SUPPORT_WEB_API_KEY`, `SUPPORT_WEB_URL` | el bot contra la web, al empujar transcripts |
| `SUPPORT_GUILD_ID`, `SUPPORT_CATEGORY_ID` | dónde viven los tickets |
| `SUPPORT_STAFF_ROLE_ID` | rol que ve y responde |
| `SUPPORT_TRANSCRIPTS_CHANNEL_ID` | canal con las copias del staff |

**Si falta cualquiera, el soporte queda desactivado**: aviso en el arranque (`[support] Disabled — missing …`) y `503 support_unavailable` en las rutas — nunca un fallo al arrancar. Se exigen también las de transcript aunque todavía no se usen, para no aceptar tickets que luego no se podrían cerrar. La comprobación de la clave va antes que la de configuración: quien no está autenticado no puede saber si el soporte está activo.

**Permisos del bot en la categoría:** ver canales, gestionar canales, enviar mensajes, insertar enlaces, adjuntar archivos y leer el historial. Los overwrites del canal solo se aceptan si el bot ya tiene esos permisos.

## Decisiones de diseño

- **Un ticket en cierre sigue existiendo para la web** hasta que ésta confirma el transcript: `GET …/messages` seguirá respondiendo `200` (sin mensajes nuevos) y solo pasará a `404` después. Un `404` inmediato haría que la web llevara al usuario a un historial que todavía no existe.
- **El antiraid no se dispara** al crear y borrar canales de tickets, porque ignora al propio bot como ejecutor ([`AntiraidSystem.ts:41`](../src/systems/antiraid/AntiraidSystem.ts)).
- **Intents:** ya están `GuildMessages` y `MessageContent`; no hay nada que tocar en el Developer Portal.

## Pendiente

- **Mensajes:** normalizador (`staff` / `user` / ignorar, notas internas `//`, menciones y emojis a texto), búfer por ticket alimentado por `messageCreate` con relectura del canal como respaldo, y las rutas `GET`/`POST …/messages`. Los nombres de rol necesitan REST (la caché de roles está desactivada) y los roles de staff se leen de `message.member.roles.keys`, que viene en el propio mensaje.
- **Cierre:** bloqueo y marca `cerrando-…`, historial completo, transcript en dos versiones, empuje a la web con reintentos (5 s, 30 s, 5 min, 30 min), copia al canal del staff, DM de mejor esfuerzo y borrado. Si la web falla, el canal queda bloqueado, se sube igualmente la copia del staff y se avisa en `STAFF_LOGS_CHANNEL`; un `4xx` de la web no se reintenta. Al arrancar se retoman los canales `cerrando-…`.
- **Botón `support-close`:** `ComponentCommand` (hay que añadir `components` a `locations` en `seyfert.config.mjs`), solo para el staff, comprobando `ctx.member.roles.keys` de la interacción. El `customId` no lleva el ticket: se resuelve por el canal donde se pulsa.
- **Automod:** excluir los canales de tickets (el staff no es un bot y hoy sería sancionable por mayúsculas o enlaces).
- **`channelDelete.ts`** (no existe aún): quitar del índice un ticket cuyo canal se borre a mano.

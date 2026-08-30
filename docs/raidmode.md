# Raidmode — `RaidmodeSystem`

Bloqueo manual, "modo dictador": el dueño del servidor lo activa a propósito porque ya sabe que hay un problema, así que no hay umbral, no hay ráfaga que contar, no hay beneficio de la duda salvo el mínimo indispensable. **Fichero:** [`src/systems/raidmode/RaidmodeSystem.ts`](../src/systems/raidmode/RaidmodeSystem.ts).

## Filosofía

Antiraid y antibots están pensados para funcionar siempre, en segundo plano, con el mínimo de falsos positivos posible — por eso antiraid exige una ráfaga de 3 acciones antes de banear, y antibots deja pasar bots verificados por defecto. Raidmode es lo contrario a propósito: es una decisión humana explícita ("activo esto porque ahora mismo no confío en nadie"), así que el sistema puede permitirse ser mucho más agresivo de lo que sería aceptable como comportamiento por defecto. Dos ideas:

1. **Cero umbral.** Una sola acción sospechosa basta — no hay contador que rellenar primero.
2. **Sustituye, no complementa.** Mientras está activo, reemplaza por completo a antiraid/antibots/`MaliciousMemberSystem`/el logging normal de eventos para esa acción concreta — no corren en paralelo. Si raidmode ya actuó, no hay nada más que comprobar.

## Excepciones — solo dos, y por motivos distintos

- **El dueño del servidor.** Discord ya bloquea banear al propietario a nivel de API, así que esto nunca fallaría por sí solo — pero se comprueba explícitamente de todas formas, para no malgastar una llamada que sabemos que va a fallar y no generar un log confuso de "baneado" cuando no ha pasado nada.
- **El propio bot.** Mismo motivo que ya tiene `AntiraidSystem`: sin esto, restaurar un backup durante un raidmode activo (o cualquier acción legítima del propio bot) se autobanearía.

**Sin whitelist.** A propósito, no por omisión: `guild_configuration.whitelist` no se consulta durante raidmode. Una whitelist es una puerta que alguien puede intentar abrir (ingeniería social, un token robado) — durante un lockdown que activaste porque ya sospechas de algo, esa puerta se cierra también. (Nota aparte: existe la idea de eliminar la whitelist también de `AntiraidSystem`, que sí la usa hoy — eso es una decisión distinta, sobre código ya en producción, no algo que se cuele aquí de rebote.)

## Qué pasa en cada disparador

Todo lo de abajo reutiliza los mismos dos puntos de entrada que ya existen — `guildMemberAdd.ts` y `guildAuditLogEntryCreate.ts` — con raidmode comprobándose **primero**, antes que cualquier otro sistema, y cortando con `return` si actúa.

- **Alguien se une** — **da igual que sea humano o bot, el trato es idéntico**: baneo **temporal**, con la misma duración configurada para el raidmode (`raidmodeTimeToDisable`) — reutilizando el sistema de `tempban` que ya existe (mismo poller de auto-desbaneo, cero infraestructura nueva). Se le da el beneficio de la duda mínimo: quien se une no ha hecho nada todavía, solo entrar durante una ventana mala. Un bot que se une no recibe ningún trato especial ni más duro aquí — sigue siendo "alguien se unió", nada más.
- **Se crea/borra un canal, se crea/borra un rol, se banea/desbanea a alguien** (mismo conjunto de acciones que ya vigila `AntiraidSystem`): baneo **permanente** para quien ejecutó la acción. A diferencia de simplemente unirse, esto ya es una acción con permisos reales detrás — no hay beneficio de la duda que dar.
- **Alguien añade un bot** (`AuditLogEvent.BotAdd`): baneo permanente para **quien lo autorizó** (no para el bot en sí, ese ya recibe su propio tempban por el primer punto, en cuanto entra como miembro) — a diferencia del antiraid normal (donde esto se descarta por ser una acción de configuración habitual y no vale la pena el riesgo de falso positivo), en raidmode el umbral cero ya asume que cualquier acción es sospechosa, así que sí cuenta.

Ninguna de estas acciones manda DM al dueño del servidor — a diferencia de `MaliciousMemberSystem`, aquí el dueño ya sabe que hay un problema (él activó el raidmode), así que un DM por cada baneo durante lo que puede ser una ráfaga real de intentos sería puro ruido. Todo se registra igual como `ServerEventLog` — y como ya vimos con `LogChannelThrottle`, el canal de logs no se satura aunque lleguen muchos de golpe.

## Lo que se descarta y por qué

- **Contraseña propia (`raidmodePassword`)**: eliminada del schema. SP Agency ya tiene un sistema de 2FA (`guild_configuration.passwordEnable`/`password`) que bloquea comandos sensibles — inventar una segunda contraseña específica de raidmode duplicaría esa misma lógica sin aportar nada. Desactivar raidmode pasa por ese mismo 2FA, no por una contraseña aparte.
- **Activación/duración**: eso es pura configuración (`raidmodeEnable`, `raidmodeTimeToDisable`) — va a la dashboard, no a un comando de Seyfert, mismo criterio que el resto de toggles de configuración pura de esta sesión.

## Parseo de duración — `RaidmodeSystem.parseDurationMs`

`raidmodeTimeToDisable` se guarda como texto tipo `'1d'`/`'30m'` (igual que `selfbotMinAccountAge`, ver [`selfbot.md`](selfbot.md), que tiene el mismo problema). No hay ninguna librería de parseo de duraciones en las dependencias (`ms`, que usaba el legacy, no está instalado) — en vez de añadir una dependencia para un formato tan simple, hay un parser propio (`/^(\d+)\s*(s|m|h|d|w)$/i`) en [`src/systems/shared/Duration.ts`](../src/systems/shared/Duration.ts), con un día como valor por defecto si el texto no encaja con el patrón (mejor un valor seguro que una expiración instantánea). Vivía como método `static` en `RaidmodeSystem` mientras `RaidmodeExpiry` era su único consumidor además de aquí; en cuanto `SelfbotSystem` lo necesitó también, se extrajo a un módulo compartido — exactamente el momento que ya se anticipaba aquí.

## Auto-desactivación por tiempo — `RaidmodeExpiry`

**Fichero:** [`src/systems/raidmode/RaidmodeExpiry.ts`](../src/systems/raidmode/RaidmodeExpiry.ts)

La dashboard no puede "esperar" a que venza el plazo por sí sola — hace falta algo en el bot. **Deliberadamente no es un poller tipo `tempban`**: un barrido periódico de toda la tabla (cada 60s, escaneando todos los servidores) tiene sentido para tempbans porque son relativamente frecuentes — para raidmode, activo en un puñado de servidores como mucho en un momento dado, escanear la tabla entera todo el rato desperdiciaría ciclos por una feature casi siempre inactiva. En su lugar, un `setTimeout` por servidor, dirigido por eventos, reutilizando la infraestructura que ya existe:

- **Un segundo listener en el mismo canal.** `sql.listen('guild_config_changed', ...)` admite más de un listener por canal (cada `.listen()` añade el suyo, todos se disparan) — así que `RaidmodeExpiry` engancha su propio callback al mismo canal que ya usa `GuildConfigCache`, sin tocar su código. Cada vez que cambia cualquier config de un servidor, se releen `raidmodeEnable`/`raidmodeTimeToDisable`/`raidmodeActivatedAt` y se reprograma (o se limpia) el `setTimeout` de ese servidor concreto.
- **Una pasada al arrancar.** En `ready` — en cada sesión de gateway nueva, no solo la primera, mismo motivo que `AntiraidSystem.recheckAllPrerequisites()` — se listan los servidores con `raidmodeEnable: true` y se reprograma el temporizador de cada uno, para cubrir el hueco de "esto pudo activarse o casi vencer mientras el bot estaba desconectado".
- **Al vencer, se desactiva y se loguea** (`ServerEventType.RaidmodeExpired`). Ese propio `UPDATE` dispara otra vez el mismo trigger de Postgres — pero como `reschedule()` no hace nada si `raidmodeEnable` ya está a `false`, no hay bucle.

Con 2-3 servidores activos a la vez como mucho, esto es unos pocos temporizadores en memoria, cero consultas periódicas a la base de datos.

# Verificación — `VerificationSystem` / `VerificationServer`

**Ficheros:** [`src/systems/verification/VerificationSystem.ts`](../src/systems/verification/VerificationSystem.ts), [`src/systems/verification/VerificationServer.ts`](../src/systems/verification/VerificationServer.ts), [`src/events/guildMemberAdd.ts`](../src/events/guildMemberAdd.ts)

Verificación **solo por web** — OAuth2 de Discord + captcha en el dashboard de SPAgency, fuera de este repo. Sustituye por completo a las 4 variantes del legacy (mensaje pasivo, código por chat, botón, "automática" basada en `antitokens`): las tres primeras las automatiza un selfbot en pocas líneas; un login OAuth2 real de Discord, no.

## Por qué no hay canal ni tipo

`guild_protection.verification*` se queda en dos campos: `verificationEnable` y `verificationRole`. No hay `verificationChannel` (nada pasa dentro de Discord salvo el DM inicial) ni `verificationType` (solo hay un mecanismo, no variantes entre las que elegir).

## Por qué esto no es un problema de base de datos

La primera versión de este diseño usaba Postgres como canal de comunicación entre el bot y el dashboard (una tabla de tokens pendientes, luego `LISTEN`/`NOTIFY` para la confirmación). Las dos ideas se descartaron por la misma razón: **la base de datos es una herramienta de persistencia, no un puente entre dos servicios**. Usarla así acopla el bot y el dashboard a un contrato implícito (qué fila escribir, qué canal escuchar) en vez de a uno explícito, y además `NOTIFY` no tiene entrega garantizada — si el bot está caído justo cuando el dashboard dispara el evento, se pierde para siempre, y con un diseño sin tabla de por medio no queda nada que reconciliar después. Para una acción de un solo disparo y no idempotente (conceder un rol), eso no es tolerable.

**La solución: REST directo entre el bot y el dashboard, y el bot como única autoridad sobre el token.** El bot firma el token con un secreto que nunca sale de su propio proceso (`VERIFICATION_SECRET`) — el dashboard no lo descifra por su cuenta, se lo pregunta al bot vía su API. Esto evita el problema de fondo de la primera versión: dos servicios ya no tienen que mantener un secreto de firma sincronizado solo para que ambos puedan confiar en lo mismo de forma independiente.

## El flujo

1. **Join** (`VerificationSystem.enforce()`, llamado desde `guildMemberAdd.ts`): si `verificationEnable` y hay `verificationRole` configurado, el bot firma un token (`VerificationSystem.issueToken`) y lo manda por DM como `<VERIFICATION_WEB_URL>/<token>`. Nada se guarda en ningún sitio — el token es autocontenido.
2. **El usuario abre el enlace** en el dashboard. La web llama a `GET /verify/:token` del bot para saber a quién pertenece.
3. **OAuth2 + captcha**, en el dashboard — fuera de este repo por completo.
4. **Al completar con éxito**, la web llama a `POST /verify/:token/complete` (autenticada). El bot concede `verificationRole` en el momento, en su propio proceso — sin DB, sin cola, sin nada que se pueda perder entre medias.

## Token — firmado, sin estado, sin base de datos

`VerificationSystem.issueToken`/`verifyToken` implementan un esquema tipo JWT hecho a mano con `node:crypto` (sin añadir dependencia, mismo criterio que llevó a no instalar `ms` para `parseDurationMs`):

```
payload   = base64url(JSON.stringify({ g: guildId, u: userId, t: issuedAtMs }))
firma     = base64url(HMAC-SHA256(VERIFICATION_SECRET, payload))
token     = "<payload>.<firma>"
```

- **Expira solo** (15 minutos, `VerificationSystem.TokenTtlMs`) — comparando `issuedAt` contra `Date.now()` al verificar. No hace falta limpiar nada en ningún sitio.
- **Comparación de firma en tiempo constante** (`timingSafeEqual`) — evita filtrar información por temporización, igual que la comparación de la API key.
- **El rol se lee en el momento de conceder, no del token.** El payload solo lleva `guildId`/`userId` — el rol a conceder sale de `GuildConfigCache` en `grantRole()`, para que un admin que cambie `verificationRole` después de emitido el token siga viendo aplicado el rol correcto, no uno obsoleto.

## `VerificationServer` — la API REST

`node:http` puro, sin `express` ni ningún framework — son dos rutas, sin cuerpo de petición que parsear, no hay nada que una dependencia resuelva mejor aquí. Escucha solo en `127.0.0.1` (bot y dashboard comparten VPS; esto nunca tuvo que salir de esa máquina).

### Contrato para el dashboard

**`GET /verify/:token`**

Llamar cuando el usuario abre el enlace de verificación.

- `200` `{ "guildId": "...", "userId": "..." }` — token válido, procede con OAuth2 + captcha para este usuario/servidor.
- `400` `{ "error": "invalid_token" }` — token con firma inválida, mal formado, o expirado (mismo error para los tres casos, a propósito — no hay nada distinto que el dashboard deba hacer entre ellos, solo informar al usuario y pedirle que vuelva a unirse al servidor para conseguir un enlace nuevo).

**`POST /verify/:token/complete`**

Llamar solo desde el backend del dashboard (nunca desde el navegador del usuario) tras completar OAuth2 + captcha con éxito.

- Cabecera obligatoria: `Authorization: Bearer <VERIFICATION_API_KEY>`.
- `200` `{ "granted": true }` — rol concedido.
- `401` `{ "error": "unauthorized" }` — cabecera ausente o API key incorrecta.
- `400` `{ "error": "invalid_token" }` — mismo criterio que en `GET`.
- `409` `{ "error": "not_configured" }` — la verificación se desactivó, o se quitó el rol configurado, entre que se emitió el token y se llamó a este endpoint.
- `502` `{ "error": "grant_failed" }` — el bot no pudo conceder el rol (el usuario ya no está en el servidor, el bot perdió el permiso `Manage Roles`, el rol está por encima del suyo...). Mostrar un error genérico al usuario; no hay nada que el dashboard pueda reintentar sin más contexto.

### Variables de entorno (`.env.example`)

- `VERIFICATION_SECRET` — firma los tokens. Nunca se comparte con el dashboard.
- `VERIFICATION_API_KEY` — autentica al dashboard contra `POST /complete`. Nunca se expone al navegador.
- `VERIFICATION_WEB_URL` — base del enlace que el bot manda por DM.
- `VERIFICATION_SERVER_PORT` — puerto de la API del bot (por defecto `4501`), solo accesible desde la propia VPS.

## Dónde encaja en `guildMemberAdd.ts`

Corre **último**, después de `RaidmodeSystem` → `MaliciousMemberSystem` → `AntibotsSystem` → `SelfbotSystem` (ver [`selfbot.md`](selfbot.md)) — a diferencia de esos cuatro, `VerificationSystem` nunca expulsa ni banea a nadie, solo manda un DM, así que no tiene sentido gastarlo en alguien que ya se fue por otra razón.

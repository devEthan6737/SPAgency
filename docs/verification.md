# Verificación — `VerificationSystem` / `VerificationApi`

**Ficheros:** [`src/systems/verification/VerificationSystem.ts`](../src/systems/verification/VerificationSystem.ts), [`src/systems/verification/VerificationApi.ts`](../src/systems/verification/VerificationApi.ts), [`src/events/guildMemberAdd.ts`](../src/events/guildMemberAdd.ts)

Solo por web — OAuth2 de Discord + captcha en el dashboard, fuera de este repo. Sustituye a las 4 variantes del legacy (mensaje pasivo, código por chat, botón, "automática" vía `antitokens`): las tres primeras las automatiza un selfbot en pocas líneas; un login OAuth2 real, no.

## Por qué no hay canal ni tipo

`guild_protection.verification*` se queda en `verificationEnable`/`verificationRole`. No hay `verificationChannel` (nada pasa en Discord salvo el DM inicial) ni `verificationType` (un solo mecanismo).

## Por qué esto no es un problema de base de datos

La primera versión usaba Postgres como canal bot↔dashboard (tabla de tokens pendientes, luego `LISTEN`/`NOTIFY`). Descartado: la base de datos es persistencia, no un puente entre servicios — acopla a un contrato implícito, y `NOTIFY` no garantiza entrega (si el bot está caído al disparo, se pierde para siempre). Para una acción de un disparo y no idempotente (conceder un rol), no es tolerable.

**Solución: REST directo bot↔dashboard, bot como única autoridad del token.** El bot firma con un secreto que nunca sale de su proceso (`VERIFICATION_SECRET`) — el dashboard se lo pregunta vía API en vez de descifrarlo, sin secreto compartido que sincronizar entre dos servicios.

## El flujo

1. **Join** (`VerificationSystem.enforce()`): si está habilitado, firma un token y lo manda por DM (`<VERIFICATION_WEB_URL>/<token>`). Nada se guarda — el token es autocontenido.
2. El usuario abre el enlace; la web llama `GET /verify/:token` para saber a quién pertenece.
3. OAuth2 + captcha, en el dashboard — fuera de este repo.
4. Al completar, la web llama `POST /verify/:token/complete` (autenticada). El bot concede el rol en el momento — sin DB, sin cola.

## Token — firmado, sin estado

`issueToken`/`verifyToken` implementan un JWT hecho a mano con `node:crypto` (mismo criterio que evitó instalar `ms`):

```
payload = base64url(JSON.stringify({ g: guildId, u: userId, t: issuedAtMs }))
firma   = base64url(HMAC-SHA256(VERIFICATION_SECRET, payload))
token   = "<payload>.<firma>"
```

- Expira solo (15 min, `TokenTtlMs`) comparando `issuedAt` — nada que limpiar.
- Comparación de firma en tiempo constante (`timingSafeEqual`).
- **El rol se lee al conceder, no del token** — el payload solo lleva `guildId`/`userId`; si un admin cambia `verificationRole` después de emitido el token, se aplica el rol correcto igualmente.

> Solo en producción se mandan enlaces y arranca esta API: `canary` y `developing` no hablan con la web (ver [cache.md](cache.md#solo-producción-habla-con-la-web--isproduction)). La configuración de verificación del dashboard sí les llega igualmente, por la base de datos.

## `VerificationApi` — la API REST

Módulo de [`ApiServer`](api.md) montado en `/verify/*`: dos rutas, sin cuerpo que parsear. Autenticación con `INTERNAL_API_KEY`.

**`GET /verify/:token`** — al abrir el enlace.
- `200 { guildId, userId }` — válido.
- `400 { error: "invalid_token" }` — firma inválida, mal formado, o expirado (mismo error para los tres, nada distinto que hacer).

**`POST /verify/:token/complete`** — solo desde el backend del dashboard, tras OAuth2+captcha exitoso.
- Header `Authorization: Bearer <INTERNAL_API_KEY>`.
- `200 { granted: true }`.
- `401` — API key ausente/incorrecta.
- `400` — mismo criterio que `GET`.
- `409` — verificación desactivada o rol quitado entre la emisión y la llamada.
- `502` — el bot no pudo conceder el rol (usuario ya no está, permiso perdido, jerarquía). Error genérico, nada que reintentar sin más contexto.

### Variables de entorno

- `VERIFICATION_SECRET` — firma tokens, nunca se comparte.
- `INTERNAL_API_KEY` — clave compartida con la web, ver [api.md](api.md); autentica al dashboard y nunca se expone al navegador.
- `VERIFICATION_WEB_URL` — base del enlace en el DM.
- `BOT_API_PORT` — puerto del servidor HTTP compartido (default `4501`), ver [api.md](api.md).

## Dónde encaja en `guildMemberAdd.ts`

Corre último, tras `RaidmodeSystem` → `MaliciousMemberSystem` → `AntibotsSystem` → `SelfbotSystem` — a diferencia de esos cuatro nunca expulsa ni banea, solo manda DM, así que no vale la pena gastarlo en alguien ya ido.

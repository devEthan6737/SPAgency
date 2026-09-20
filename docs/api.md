# API HTTP — `ApiServer`

**Ficheros:** [`src/systems/api/`](../src/systems/api/) (`ApiServer.ts`, `ApiHttp.ts`, `ApiAuth.ts`)

Un único servidor `node:http` para todo lo que la web/dashboard necesita del bot. Solo `127.0.0.1` (comparten VPS), puerto `BOT_API_PORT` (default `4501`). Se arranca una vez desde `ready.ts` con la lista de módulos: `ApiServer.start(client, [VerificationApi, …])`.

## Router

El primer segmento del path elige el módulo (`/verify/*` → `VerificationApi`); el módulo recibe el resto en `request.segments` y devuelve un `ApiResponse` (`reply(status, body)`). Sin módulo que encaje: `404 { error: "not_found" }`. El servidor es el único que escribe la respuesta.

Un `ApiModule` es `{ prefix, handle(client, request) }`; en este repo son clases con miembros estáticos.

| Módulo | Prefijo | Clave | Doc |
| :----- | :------ | :---- | :-- |
| `VerificationApi` | `/verify` | `INTERNAL_API_KEY` | [verification.md](verification.md) |
| `SupportApi` | `/support` | `INTERNAL_API_KEY` | [support.md](support.md) |

## Convenciones

- **Autenticación:** `ApiAuth.isAuthorized(headers)` compara `Authorization: Bearer <clave>` con `INTERNAL_API_KEY` en tiempo constante; falla cerrado si la variable no está definida. Es una única clave compartida con la web y en **ambos sentidos**: la web la manda a esta API y el bot la manda a la web al empujar transcripts (`WEB_URL` es la base de esas llamadas). Nunca llega al navegador.
- **Errores:** `throw new ApiError(status, code)` en cualquier punto termina la petición con `{ error: code }`. Cualquier otra excepción se registra y responde `500 internal_error`.
- **Cuerpos:** `request.json()` lee bajo demanda y con tope de 32 KB (`413 payload_too_large`, y cierra la conexión); vacío o malformado → `400 invalid_body`. Las rutas que no lo llaman nunca leen el cuerpo.
- **Query:** `request.query` es un `URLSearchParams`.

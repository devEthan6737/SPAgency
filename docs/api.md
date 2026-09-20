# API HTTP — `ApiServer`

**Ficheros:** [`src/systems/api/`](../src/systems/api/) (`ApiServer.ts`, `ApiHttp.ts`, `ApiAuth.ts`)

Un único servidor `node:http` para todo lo que la web/dashboard necesita del bot. Solo `127.0.0.1` (comparten VPS), puerto `VERIFICATION_SERVER_PORT` (default `4501`). Se arranca una vez desde `ready.ts` con la lista de módulos: `ApiServer.start(client, [VerificationApi, …])`.

## Router

El primer segmento del path elige el módulo (`/verify/*` → `VerificationApi`); el módulo recibe el resto en `request.segments` y devuelve un `ApiResponse` (`reply(status, body)`). Sin módulo que encaje: `404 { error: "not_found" }`. El servidor es el único que escribe la respuesta.

Un `ApiModule` es `{ prefix, handle(client, request) }`; en este repo son clases con miembros estáticos.

| Módulo | Prefijo | Clave | Doc |
| :----- | :------ | :---- | :-- |
| `VerificationApi` | `/verify` | `VERIFICATION_API_KEY` | [verification.md](verification.md) |

## Convenciones

- **Autenticación por funcionalidad:** `ApiAuth.isAuthorized(headers, 'ENV_NAME')` compara `Authorization: Bearer <clave>` en tiempo constante; falla cerrado si la variable no está definida. Cada módulo tiene su clave, para que filtrar una no abra las demás.
- **Errores:** `throw new ApiError(status, code)` en cualquier punto termina la petición con `{ error: code }`. Cualquier otra excepción se registra y responde `500 internal_error`.
- **Cuerpos:** `request.json()` lee bajo demanda y con tope de 32 KB (`413 payload_too_large`, y cierra la conexión); vacío o malformado → `400 invalid_body`. Las rutas que no lo llaman nunca leen el cuerpo.
- **Query:** `request.query` es un `URLSearchParams`.

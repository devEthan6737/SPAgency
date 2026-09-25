# Emojis personalizados

Los mensajes del bot usan **emojis de aplicación** (los que se suben en el Developer Portal, pestaña *Emojis*), no unicode. Pertenecen a la aplicación, así que se ven en cualquier servidor y en DM sin permisos de "usar emojis externos".

## El problema de las tres aplicaciones

Producción, canary y developing son tres aplicaciones de Discord distintas. Los emojis tienen **el mismo nombre en las tres, pero ids distintos**. Por eso el código nunca guarda un id: guarda nombres y resuelve el id al arrancar.

## Piezas

**Ficheros:** [`src/systems/emojis/`](../src/systems/emojis/)

| Pieza | Qué es |
|---|---|
| `AppEmojiName` | Enum con los 39 nombres exactos subidos (`sp_fbm_yes`...). Están todos aunque algunos aún no se usen: `Emojis.missing()` sirve para saber qué le falta a una aplicación. |
| `EmojiKey` | Enum con lo que un mensaje *quiere decir* (`Success`, `Ban`, `Warning`...). Es lo único que usan los locales. Hay una clave por cada emoji subido. |
| `EmojiCatalog` | `Record<EmojiKey, { name, fallback }>`: qué emoji subido y qué unicode de respaldo corresponde a cada clave. Añadir una clave sin entrada no compila, y **tampoco compila un `AppEmojiName` que ninguna clave use** (`EveryEmojiIsUsed`; el error nombra el emoji). |
| `Emojis` | Clase estática: `setup(client)`, `load(token)`, `get(key)`, `missing()`. |

## Flujo

1. `src/index.ts` llama a `Emojis.setup(client)` **antes** de `client.start()` (hace `load`, y registra por log si falla o si faltan nombres). Es una petición directa a `GET /applications/{id}/emojis` (el id es el primer segmento del token). Tiene que ir antes porque Seyfert importa los locales dentro de `start()` y los textos fijos (plantillas con `emoji(...)` dentro) se evalúan al importarse.
2. Los ids quedan solo en memoria. No hay fichero de caché.
3. Los locales piden `emoji(EmojiKey.X)`, que devuelve `<:nombre:id>` (o `<a:...>` si es animado).
4. Si a esa aplicación le faltan nombres, se avisa por log: `[emojis] This application lacks N emojis: ...`.

## Fallback

`Emojis.get()` devuelve el unicode de la clave si el emoji no está en la aplicación, o si `load` falló (Discord caído, token sin permisos, timeout de 10 s). El bot arranca igual y los mensajes siguen legibles. Una recarga fallida no borra lo cargado antes.

## Dónde NO se ven

Los emojis personalizados no se renderizan en **nombres ni descripciones de slash commands**, ni en etiquetas de botón sin un campo `emoji` propio. En esos sitios se queda el unicode (o nada). Los textos con emoji personalizado solo deben ir en contenido de mensaje o descripción de embed.

## Añadir o cambiar uno

1. Subir el emoji, con el mismo nombre, a las **tres** aplicaciones.
2. Añadir el nombre a `AppEmojiName` si es nuevo.
3. Para usarlo: añadir una clave a `EmojiKey` y su entrada en `EmojiCatalog` (con el unicode de respaldo), y usar `emoji(EmojiKey.X)` en el locale.
4. Cambiar solo qué imagen representa una clave = editar su línea en `EmojiCatalog`.

## Dónde se usa cada uno

| Clave | Uso |
|---|---|
| `Success`, `Error`, `Warning`, `Ban`, `Raid`, `Welcome`, `Backup` | Prefijo de los mensajes de estado, moderación y logs |
| `MessageLatency`, `ApiLatency`, `DatabaseLatency` | Las tres latencias de `/ping` |
| `Members`, `Cpu`, `Ram` | Usuarios, CPU y RAM de `/info` (usan las mismas imágenes que `FbmUser` y `RiconcCpu`/`RiconcRam`; varias claves pueden apuntar al mismo emoji) |
| `Document` | Copia del ticket para el staff (`.txt` adjunto) |
| `Book` | Introducción de `/comandos` |
| `StarBlue`, `StarRed`, `StarYellow` | Categorías de `/comandos` (configuración, moderación, otros) |
| `LoadingGray`, `LoadingGreen`, `LoadingSpinner`, `LoadingBlue` | "Calculando" de `/ping`, "limpiando" de `/unnuke`, "escaneando" de `/detect`, "cerrando" de un ticket |
| `SuccessAnimated`, `ErrorAnimated` | Emoji de los botones de confirmar y cancelar (`Confirmation.ask`) |
| `BetaStart` + `BetaEnd`, `Arrow`, `TypeScript`, `JavaScript`, `Seyfert`, `PostgreSql`, `StarBlack`, `StarPurple`, `Developer`, `Heart` | `/info` ("Construido con", "En números" y créditos) |
| `Attachment`, `Partner`, `Visa` | Iconos de los botones de invitar al bot, servidor de soporte y donar de `/info` (`Attachment` también en `/apelar`) |
| `Boost`, `Luck`, `YoutubeBadge`, `YoutubeLogo` | Sin uso todavía: esperan contenido real |

## Pendientes

Solo quedan sin usar `Boost`, `Luck`, `YoutubeBadge` y `YoutubeLogo`. Tienen clave y fallback, así que basta con escribir `emoji(EmojiKey.X)` (o `Emojis.get(EmojiKey.X)` en código) en el sitio que les toque.

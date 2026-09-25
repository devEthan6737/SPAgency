# /comandos

Lista de comandos y detalle de uno, en Components V2 y en el idioma de quien pregunta.

**Ficheros:** [`src/commands/others/commands.ts`](../src/commands/others/commands.ts), [`src/systems/commands/CommandLocalizer.ts`](../src/systems/commands/CommandLocalizer.ts)

## Lista (`/comandos`)

Paginada con el [paginador](pagination.md): **una página por categoría** (configuración, moderación, otros), en el orden en que las declara el locale. Una categoría con más de 10 comandos se parte en trozos de 10 (`Moderación (1/2)`), para no acercarse al límite de 4000 caracteres de texto por mensaje.

Cada página lleva:
- Un título con la estrella de la categoría (azul, roja o amarilla; una categoría nueva sin estrella asignada recibe la negra) y la introducción en texto pequeño.
- Los comandos ordenados por su nombre en el idioma del usuario, cada uno con su descripción y, si tiene subcomandos, una línea pequeña debajo con sus nombres.
- Una pista para pedir el detalle de uno.

El botón central, deshabilitado, indica la página (`2/5 · Moderación`). Un comando sin categoría (`props.category`) no aparece.

## Detalle (`/comandos ban`)

Una tarjeta sin paginar: nombre y descripción, categoría y alias en texto pequeño, sección de **opciones** (con `(requerido)`) y, si el comando tiene, sección de **subcomandos**. Se busca por el nombre base o por el nombre en cualquier idioma, sin distinguir mayúsculas: `/comandos banear` y `/comandos BAN` encuentran el mismo. Si no existe, responde con un mensaje de texto normal.

## Idioma (`CommandLocalizer`)

Antes la lista solo mostraba la descripción inglesa. Seyfert rellena `name_localizations` y `description_localizations` de cada comando a partir de los locales, con claves de Discord (`es-ES`, `en-US`...). `CommandLocalizer.locale(ctx)` elige la clave igual que `ctx.t` elige el idioma; un comando de prefijo no tiene interacción, así que usa el primer locale de Discord del idioma por defecto. Si algo no tiene traducción (un subcomando sin `@LocalesT`, por ejemplo), se muestra el texto base en inglés.

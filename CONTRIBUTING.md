# ¡Bienvenido/a!

Gracias por su interés en contribuir. Lea antes la [licencia](LICENSE) y el [código de conducta](code_of_conduct.md).

## Principiantes

Para contribuir con código hace falta:

* Git y GitHub ([crash course](https://youtu.be/HiXLkL42tMU))
* TypeScript con [Node.js](https://nodejs.org/)
* [Seyfert](https://seyfert.dev/) — framework de Discord del bot
* [Drizzle ORM](https://orm.drizzle.team/) sobre PostgreSQL, para persistencia

## Empezando

Lea el [README](README.md) primero.

### Configuración

El proyecto usa **pnpm**, no npm. Copie [`.env.example`](.env.example) a `.env` y rellene `BOT_TOKEN`, `PREFIX`, `DATABASE_URL`.

```bash
pnpm install
pnpm run db:migrate   # aplica las migraciones de drizzle
pnpm run dev          # tsc --watch
```

## Estilo de código

Así está escrito todo `src/`. Si porta algo del bot legacy (`comandos/`, `eventos/`, `schemas/`), esto reemplaza ese estilo, no convive con él.

### Idioma

- `@Declare({ name, description })` siempre en inglés (fallback que registra Discord). El resto de idiomas van por `@LocalesT(...)` a claves de `src/locales/es.ts`/`en.ts`, nunca hardcodeado.
- Ficheros de comando, claves de opciones y nombres de clase en inglés. Fichero, carpeta de categoría y clave de locale coinciden siempre (`report.ts` → `commands.others.report`).
- Un fichero de locale no mezcla idiomas. Texto repetido entre comandos hermanos va en un namespace `shared` de esa categoría, no duplicado.

### Estructura de comandos

- Comando simple: un fichero en `src/commands/<categoria>/`. Con subcomandos: una carpeta con un fichero por subcomando + un "padre" (`@AutoLoad()`) — Seyfert recoge solo los `export default` que sean `SubCommand`, sin `@Options([...])` a mano.
- Todo comando lleva `props: { category: '<carpeta>' }`. Solo aparece en `/commands` si esa categoría tiene etiqueta en `commands.others.commands.categories` — así una categoría (`staff`) puede quedar oculta sin excluirla en código.
- Claves de opciones en minúscula e inglés (lo exige Discord).

### Permisos y seguridad

- Permisos vía `botPermissions`/`defaultMemberPermissions` en `@Declare`, nunca `ctx.member.permissions.has(...)` a mano.
- Todo comando sobre un miembro concreto comprueba, en este orden: no es el bot → no es uno mismo → jerarquía del invocador vs. objetivo (dueño exento). Discord solo valida la jerarquía del *bot*, nunca la de quien invoca.
- Restricciones por identidad ("solo el dueño") van por middleware (`src/middlewares/<nombre>.middleware.ts`), no por `if` suelto.
- Descargar una URL dada por el usuario exige protección SSRF: solo `http`/`https`, bloquear IPs privadas/loopback/link-local, `redirect: 'error'`, timeout, y límite de tamaño leyendo el stream real (nunca fiarse de `Content-Length`).
- Toda acción destructiva pasa por `Confirmation.ask(ctx, {...})` (`src/systems/confirmation/`) antes de ejecutar.

### Internacionalización

- `ctx.t` solo para responder a quien invocó el comando. Sin invocador directo (log a un canal, p. ej.), se usa `client.t(guild.language)` explícito — lo lee el staff del servidor, no quien disparó la acción.
- Locales en espejo del árbol de comandos: `commands.<categoria>.<comando>.<clave>`. Texto dinámico = función `(args) => string`; fijo = string plano.

### Base de datos (Drizzle)

- Un fichero por tabla en `src/database/schema/`, con sus enums propios en el mismo fichero.
- Un repositorio por agregado en `src/database/repositories/`, clase con métodos **estáticos** (nunca instanciada).
- Un método en camino caliente (cada mensaje, cada minuto...) usa consulta específica y ligera, no un `get()` genérico.
- Columna consultada sin condiciones de forma recurrente (un poller) lleva índice.
- `drizzle-kit generate` necesita TTY para desambiguar rename de drop+add, y este entorno no la tiene — cuando pase, se escribe la migración y el snapshot a mano y se verifica con `generate` de nuevo (debe reportar "no hay cambios pendientes").

### Clases y organización

- Sin cadenas de herencia (`A extends B extends C`) — como mucho una base abstracta + hermanas concretas.
- Contrato de clase abstracta con **métodos** abstractos, no propiedades sobreescritas.
- Función usada en un solo fichero → `private static` de esa clase, no función suelta. Compartida entre hermanos → clase de métodos estáticos en un fichero compartido de esa carpeta (ver `unnuke/shared.ts`), nunca duplicada.
- `src/systems/` para subsistemas transversales; `src/middlewares/` aparte, un fichero por middleware.
- Sin comentarios de *qué* hace el código — solo de *por qué* cuando no es obvio. Documentación de hover = JSDoc, no `//`.
- Sin `switch` para traducir un enum externo a forma propia cuando cada rama solo asigna los mismos campos: eso es una tabla (`Record<Enum, Forma>` o `Partial<...>`) + lookup y guard clause, no control de flujo. `switch`/`if` encadenado solo cuando hay comportamiento distinto de verdad.
- Constante usada por una sola clase → `private static readonly` en PascalCase (`MaxRetries`), no módulo suelto en `SCREAMING_SNAKE_CASE`. Ese formato se reserva para constantes de módulo sin clase dueña.

### Returns y guard clauses

- Todo `run()` de comando empieza con `if (!ctx.inGuild()) return;`.
- Guard clauses en una línea, sin `if/else` anidado: `if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });`.
- `return await ...` es el patrón fijo para cortar devolviendo la respuesta — nunca separado en dos líneas.
- Orden fijo en comandos sobre miembro: bot → uno mismo → jerarquía → lógica del comando.
- La respuesta de éxito va al final del método, sin `return` delante.

### Embeds y respuestas

- Embed solo para el resultado final de una acción exitosa. Errores de validación → `ctx.write({ content: '...' })` en texto plano, nunca embed.
- Color siempre con `EmbedColors` por semántica (`Red` para destructivo), nunca hex a mano.
- Sin campos decorativos (footer, thumbnail, author) si el mensaje cabe en `setDescription`.

### Fallos no críticos

- Operación que puede fallar sin interrumpir el comando (DM, resolver un miembro que ya no está) → `.catch(() => {})`/`.catch(() => undefined)` en la propia promesa, no `try/catch` alrededor de todo.
- `try/catch` completo solo si hay que reaccionar distinto al error (loggear, cleanup, distinguir códigos) — no como salvavidas genérico.

### Accesores de locale

- Si el comando usa varias claves del mismo namespace, se saca a constante: `const t = ctx.t.commands.moderation.tempban;` (y otra para `shared` si aplica). Nunca repetir la ruta completa en cada línea.

### Commits

- Inglés, sin trailer de co-autoría ni crédito a herramienta/IA.
- Un commit por asunto — dos cambios sin relación son dos commits.

### Antes de dar nada por terminado

`pnpm exec tsc --noEmit` limpio. Si toca UI/comandos, probarlo contra un bot real — compilar no garantiza que el comando haga lo correcto en Discord.

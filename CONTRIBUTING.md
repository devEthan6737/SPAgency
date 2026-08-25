# ¡Bienvenido/a!

¡Gracias por su interés en contribuir a este proyecto!

Antes que todo, le pido amablemente que lea con atención y detenimiento la [licencia](LICENSE) y el [código de conducta](code_of_conduct.md), ya que es escencial que conozca las pautas y condiciones antes de contribuir.

## Principiantes

Si usted es principiante, pero desea contribuir con **código**, ha de tomar en cuenta que debe contar con los siguientes conocimientos principales:

* Git y GitHub ([crash course](https://youtu.be/HiXLkL42tMU))
* TypeScript (con [node.js](https://nodejs.org/))
* [Seyfert](https://seyfert.dev/) — el framework de Discord que usa el bot
* [Drizzle ORM](https://orm.drizzle.team/) sobre PostgreSQL, para todo lo que sea persistencia

## Empezando

Lea el [README](README.md) para obtener una vista rápida del proyecto.

### Configuración

El proyecto usa **pnpm**, no npm. Copie [`.env.example`](.env.example) a `.env` y rellene:

```yaml
BOT_TOKEN     # token del bot de Discord
PREFIX        # prefix de los comandos de texto, ej. "sp!"
DATABASE_URL  # cadena de conexión a Postgres
```

```bash
pnpm install
pnpm run db:migrate   # aplica las migraciones de drizzle
pnpm run dev          # tsc --watch
```

## Estilo de código

Esto no son sugerencias sueltas — es cómo está escrito todo el código nuevo del proyecto (`src/`). Si va a tocar algo ahí, sígalo; si va a portar algo del bot legacy (`comandos/`, `eventos/`, `schemas/`), esto es lo que reemplaza a ese estilo, no lo que convive con él.

### Idioma

- El `@Declare({ name, description })` de **todo** comando o subcomando va **en inglés**. Es la base/fallback que registra Discord.
- El español (y cualquier otro idioma) se cubre con `@LocalesT(...)` apuntando a claves de `src/locales/es.ts` / `en.ts` — nunca hardcodeado en el `@Declare`.
- Los ficheros de comandos, las claves de opciones (`createStringOption`, etc.) y los nombres de clase van en inglés. El nombre de fichero, la carpeta de categoría y la clave del locale coinciden siempre (`report.ts` → `commands.others.report`).
- Dentro de un mismo fichero de locale no se mezcla idioma — todo lo que hay en `es.ts` está en español, todo en `en.ts` en inglés. Si algo se repite entre comandos hermanos (mensajes de error compartidos, p. ej.), va en un namespace `shared` dentro de esa categoría en vez de duplicarse.

### Estructura de comandos

- Un comando simple (sin subcomandos) es un único fichero en `src/commands/<categoria>/`.
- Un comando con subcomandos es una **carpeta** con su mismo nombre: un fichero por subcomando + un fichero "padre" (mismo nombre que la carpeta) decorado con `@AutoLoad()`. Seyfert recoge automáticamente cualquier fichero hermano cuyo `export default` sea un `SubCommand` — no hace falta `@Options([Sub1, Sub2])` a mano.
- Todo comando lleva `props: { category: '<carpeta>' }` para que aparezca agrupado en `/commands`. Una categoría solo se lista ahí si tiene una etiqueta en `commands.others.commands.categories` del locale — así se puede tener una categoría "oculta" (p. ej. `staff`) sin excluirla a mano en el código.
- Las claves de las opciones (`const options = { member: createUserOption(...) }`) van siempre en minúscula e inglés — Discord lo exige para el nombre registrado.

### Permisos y seguridad

- Los permisos se declaran con `botPermissions`/`defaultMemberPermissions` en `@Declare`. Nunca comprobaciones manuales de `ctx.member.permissions.has(...)` — Seyfert las aplica en runtime igual, y además Discord oculta/gatea el comando de forma nativa cuando puede.
- Cualquier comando que actúe sobre un miembro concreto (ban, kick, timeout, roles, apodo...) comprueba, por este orden: que no sea el propio bot, que no sea uno mismo, y la **jerarquía de roles del invocador contra el objetivo** (dueño del servidor exento). Discord solo valida la jerarquía del *bot*, nunca la de quien invoca el comando — sin este check, cualquiera con el permiso adecuado podría actuar sobre alguien por encima de su propio rango.
- Restricciones por identidad (p. ej. "solo el dueño del servidor") no se pueden expresar con un bit de permiso de Discord — usan un middleware (`src/middlewares/<nombre>.middleware.ts`), no un `if` suelto en el comando.
- Cualquier comando que descargue una URL dada por el usuario (p. ej. un icono) debe protegerse contra SSRF: solo `http`/`https`, resolver el host y bloquear IPs privadas/loopback/link-local, `redirect: 'error'` (si no, el check de host se salta con un 302), timeout, y limitar el tamaño leyendo el stream real — nunca fiarse del header `Content-Length`.
- Toda acción destructiva o difícil de revertir (nuke de un canal, ban masivo...) pasa por `Confirmation.ask(ctx, {...})` (`src/systems/confirmation/`) antes de ejecutar nada.

### Internacionalización

- `ctx.t` se usa para responder a quien invocó el comando — resuelve el idioma de **su** cliente de Discord.
- Para mensajes que se mandan sin que haya un invocador directo delante (p. ej. un log al canal configurado del servidor), no se usa `ctx.t` — se resuelve el idioma guardado del servidor (`guild.language`) explícitamente con `client.t(idioma)`, porque quien lo lee es el staff del servidor, no quien disparó la acción.
- La estructura de los locales es un espejo del árbol de comandos: `commands.<categoria>.<comando>.<clave>`. Los textos dinámicos son funciones `(args) => string`; los fijos, strings planos.

### Base de datos (Drizzle)

- Un fichero por tabla en `src/database/schema/`. Los enums/tipos específicos de una tabla (p. ej. `BlacklistReason`, `ServerEventType`) se definen en el mismo fichero que la tabla, no aparte.
- Un repositorio por agregado en `src/database/repositories/`, siempre como clase con métodos **estáticos** (nunca se instancia) — ver `GuildRepository`, `WarnRepository`, `TempbanRepository`.
- Si un método de repositorio se va a llamar en un camino caliente (cada mensaje, cada minuto...), que sea una consulta específica y ligera (columnas concretas, mínimos joins) en vez de reutilizar un `get()` genérico — ver `getPrefix`, `getLogSettings`.
- Si una columna se consulta sin condiciones de forma recurrente (un poller, p. ej.), lleva índice.
- `drizzle-kit generate` necesita una TTY interactiva para desambiguar un rename de un drop+add, y este entorno no la tiene. Cuando pase, se escribe la migración SQL y el snapshot a mano (a partir del snapshot anterior) y se verifica volviendo a correr `generate` — debe reportar "no hay cambios pendientes".

### Clases y organización del código

- Nada de cadenas de herencia (`A extends B extends C`). Como mucho, una clase base abstracta + clases concretas como hermanas — nunca una capa intermedia por categoría.
- El contrato de una clase abstracta se expresa con **métodos** abstractos (`protected abstract getColor(): ...`), no con propiedades sobreescritas.
- Si una función solo se usa dentro de un fichero/comando, es un método `private static` de esa clase, no una función suelta a nivel de módulo.
- Si de verdad se comparte entre varios ficheros hermanos (varios subcomandos de una misma carpeta, p. ej.), se extrae a un fichero compartido en esa misma carpeta como una clase con métodos estáticos (ver `unnuke/shared.ts` → `UnnukeHelpers`), no se duplica.
- `src/systems/` es para subsistemas transversales reutilizables (`logs/`, `confirmation/`, `ubfb/`, `tempban/`...). `src/middlewares/` es aparte, un fichero por middleware, nombrado `<nombre>.middleware.ts`.
- Sin comentarios que expliquen *qué* hace el código. Solo cuándo el *por qué* no es obvio (una restricción externa, un bug que se está esquivando, una decisión no evidente). La documentación de una clase/método pensada para verse en el hover del editor es JSDoc (`/** */`), no `//`.

### Returns y guard clauses

- Todo `run()` de un comando empieza con `if (!ctx.inGuild()) return;` como primerísima línea, antes de leer nada de `ctx`.
- Las validaciones se escriben como guard clauses en una sola línea, no como `if/else` anidado: `if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });`. Se sale lo antes posible; el cuerpo del método no se anida.
- Ese `return await ...` (con `await` delante, aunque el valor no se use) es el patrón fijo para cortar la ejecución devolviendo directamente la respuesta al usuario — no se separa en dos líneas (`await ctx.write(...); return;`).
- El orden de los guards en comandos que apuntan a un miembro es siempre el mismo: bot → uno mismo → jerarquía de roles → recién ahí la lógica del comando.
- La respuesta "de éxito" (el resultado real de la acción) va al final del método, sin `return` delante — es la última instrucción, no hace falta cortar nada después de ella.

### Embeds y respuestas

- Un embed (`new Embed().setColor(...).setDescription(...)`) es solo para el resultado final de una acción que tuvo éxito. Los errores de validación (guard clauses) van como `ctx.write({ content: '...' })` en texto plano, nunca como embed — un embed para "no puedes hacer esto" es ruido innecesario.
- El color del embed se elige por semántica de la acción, siempre con `EmbedColors` (`EmbedColors.Red` para algo destructivo tipo ban/nuke, etc.), nunca un hex a mano.
- No se decora un embed con campos que no aportan (footer, thumbnail, author) si el mensaje cabe en una descripción — un embed con `setDescription` solo es preferible a uno sobrecargado de campos.

### Fallos no críticos

- Si una operación puede fallar y ese fallo no debe interrumpir el comando (mandar un DM al usuario afectado, resolver un miembro que puede que ya no esté en el servidor), se usa `.catch(() => {})` o `.catch(() => undefined)` en la propia promesa, no un `try/catch` alrededor de todo el bloque. Mantiene el guard clause siguiente en la misma línea de lectura.
- Un `try/catch` completo solo aparece cuando de verdad hay que reaccionar de forma distinta al error (loggear, hacer cleanup, distinguir códigos de estado) — no como salvavidas genérico "por si acaso".

### Accesores de locale

- Al principio del `run()`, si el comando va a usar varias claves del mismo namespace, se saca a una constante corta: `const t = ctx.t.commands.moderation.tempban;`. Si además usa el namespace `shared`, otra constante aparte: `const shared = ctx.t.commands.moderation.shared;`. No se repite la ruta completa (`ctx.t.commands.moderation.tempban.foo.get()`) en cada línea.

### Commits

- Mensajes en inglés, sin ningún trailer de co-autoría ni crédito a ninguna herramienta o IA.
- Un commit por asunto — si un cambio toca dos cosas sin relación, son dos commits.

### Antes de dar nada por terminado

`pnpm exec tsc --noEmit` tiene que pasar limpio. Si toca UI/comandos, probarlos contra un bot real cuando sea posible — la compilación no garantiza que el comando haga lo correcto en Discord.

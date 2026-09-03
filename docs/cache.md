# Herramienta de depuración — `/cache` y `BOT_ENV`

**Ficheros:** [`src/commands/others/cache/`](../src/commands/others/cache/), [`src/systems/shared/Environment.ts`](../src/systems/shared/Environment.ts), [`src/systems/protection/GuildConfigCache.ts`](../src/systems/protection/GuildConfigCache.ts)

`/cache` inspecciona, calienta o invalida a mano la entrada de `GuildConfigCache` (ver `antiraid.md` sección 2) de un servidor concreto. Es una herramienta de depuración interna del bot, no algo pensado para un admin de servidor cualquiera.

## Por qué no hace falta una allowlist de staff

La primera idea era gatear esto por una lista de IDs de Discord del equipo. Se descartó porque no hace falta: **producción, testing (canary) y desarrollo son aplicaciones de Discord distintas**, cada una con su propio token. Quien tiene el bot de producción en su servidor nunca tiene `/cache` disponible, porque ese proceso ni lo registra ni lo puede ejecutar — no por permisos, sino porque no existe ahí. El bot de testing lo instala gente que sabe que es un tester; el de desarrollo, prácticamente solo el propio desarrollador. El control de acceso vive en **qué proceso es cada uno**, no en una lista de usuarios autorizados dentro de un único bot.

## `BOT_ENV` — production | testing | developing

`src/systems/shared/Environment.ts` expone `getBotEnvironment()`/`isProduction()`. Por defecto, si `BOT_ENV` no está puesto o tiene un valor no reconocido, se asume `production` — el fallo debe ir siempre hacia el comportamiento más restrictivo, nunca al revés. Sustituye conceptualmente al viejo `TURN_ON_CANARY` del legacy (un booleano de 2 estados) por algo más expresivo.

Cualquier comando puede marcarse `props: { devOnly: true }` (tipado en [`src/seyfert.d.ts`](../src/seyfert.d.ts), junto a `category`) para quedar fuera de producción — `/cache` es el primer caso, pero no tiene por qué ser el único.

## Cómo se filtra — antes de que Seyfert publique nada

**Fichero:** [`src/index.ts`](../src/index.ts)

Al investigar esto se descubrió que **el proyecto nunca había llamado a `client.uploadCommands()`** — un olvido, no una decisión. Se añadió junto con el filtro:

```ts
await client.start();

if (isProduction()) {
    client.commands.values = client.commands.values.filter((command) => !command.props?.devOnly);
}
await client.uploadCommands({ cachePath: './commands-cache.json' });
```

`client.commands.values` es el mismo array del que `uploadCommands()` lee para decidir qué registrar en Discord, y también el que el propio proceso usa para resolver qué comando ejecutar cuando llega una interacción — filtrarlo aquí, antes de subir nada, deja los comandos `devOnly` fuera de **los dos sitios** en un proceso de producción: ni se registran, ni se podrían ejecutar aunque alguien intentara invocarlos a mano.

`cachePath` no es opcional por descuido: Seyfert compara el set de comandos actual contra el de la última subida y solo llama a la API de Discord si cambió de verdad (`shouldUploadCommands`) — así que llamar a esto en cada arranque no reenvía nada innecesariamente ni arriesga rate limits.

## Los tres subcomandos

Todos aceptan un `guild_id` opcional (por defecto, el servidor donde se ejecuta) — ver [`shared.ts`](../src/commands/others/cache/shared.ts).

- **`info`**: `GuildConfigCache.peek(guildId)` — lectura pasiva, nunca dispara una consulta. Si no hay nada cacheado, lo dice; si lo hay, lo vuelca tal cual.
- **`hit`**: `GuildConfigCache.invalidate(guildId)` seguido de un `get()` cronometrado (`performance.now()`) — un fallo de caché **garantizado**, no uno que pueda salir gratis porque ya estuviera caliente. Responde con los milisegundos que tardó el round-trip a Postgres — un termómetro rápido de si la DB va lenta, sin entrar a la VPS.
- **`reload`**: mismo mecanismo que `hit` (invalidar + recalentar), sin cronometrar — una válvula de escape si se sospecha que un `guild_config_changed` no llegó (el bot estuvo desconectado justo cuando se disparó) y no se quiere esperar a los 10 minutos del barrido periódico de `GuildConfigCache.start`.

## Lo que se añadió a `GuildConfigCache` para esto

Antes solo tenía `get()` (fetch-on-miss) y un `entries` privado. Se añadieron dos métodos públicos, pequeños, sin cambiar el comportamiento existente:

- **`peek(guildId)`** — lectura sin efectos secundarios, para `info`.
- **`invalidate(guildId)`** — borra una entrada concreta; el propio listener de `guild_config_changed` ahora lo reusa en vez de tocar el `Map` privado directamente.

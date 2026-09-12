# Herramienta de depuración — `/cache` y `BOT_ENV`

**Ficheros:** [`src/commands/others/cache/`](../src/commands/others/cache/), [`src/systems/shared/Environment.ts`](../src/systems/shared/Environment.ts), [`src/systems/protection/GuildConfigCache.ts`](../src/systems/protection/GuildConfigCache.ts)

`/cache` inspecciona, calienta o invalida a mano la entrada de `GuildConfigCache` (ver `antiraid.md` sección 2) de un servidor. Herramienta interna, no pensada para un admin cualquiera.

## Por qué no hay una allowlist de staff

Se descartó gatear por lista de IDs: **producción, testing y desarrollo son aplicaciones de Discord distintas**, cada una con su propio token. Quien tiene el bot de producción nunca tiene `/cache` disponible — ni existe ahí. El control de acceso vive en **qué proceso es cada uno**, no en una lista de usuarios dentro de un único bot.

## `BOT_ENV` — production | testing | developing

`Environment.ts` expone `getBotEnvironment()`/`isProduction()`. Sin valor o valor no reconocido → se asume `production` (el fallo va siempre al lado restrictivo). Sustituye al viejo `TURN_ON_CANARY` (booleano) por algo más expresivo.

Cualquier comando puede marcarse `props: { devOnly: true }` ([`src/seyfert.d.ts`](../src/seyfert.d.ts)) para quedar fuera de producción.

## Cómo se filtra — antes de subir nada

**Fichero:** [`src/index.ts`](../src/index.ts)

El proyecto nunca había llamado a `client.uploadCommands()` — un olvido, corregido junto con el filtro:

```ts
await client.start();
if (isProduction()) {
    client.commands.values = client.commands.values.filter((command) => !command.props?.devOnly);
}
await client.uploadCommands({ cachePath: './commands-cache.json' });
```

`client.commands.values` es el mismo array que usa `uploadCommands()` para registrar y el propio proceso para resolver comandos entrantes — filtrar aquí deja `devOnly` fuera de los dos sitios en producción. `cachePath` evita resubir a la API si el set no cambió (`shouldUploadCommands`).

## Los tres subcomandos

Todos aceptan `guild_id` opcional (por defecto, el servidor actual).

- **`info`**: `GuildConfigCache.peek(guildId)` — lectura pasiva, nunca dispara consulta.
- **`hit`**: invalida + `get()` cronometrado — fallo de caché garantizado, no uno gratis. Devuelve el round-trip a Postgres en ms, para saber si la DB va lenta sin entrar a la VPS.
- **`reload`**: mismo mecanismo sin cronometrar — válvula de escape si se sospecha un `guild_config_changed` perdido, sin esperar al barrido de 10 minutos.

## Añadido a `GuildConfigCache` para esto

`peek(guildId)` (lectura sin efectos secundarios) e `invalidate(guildId)` (borra una entrada — el propio listener de `guild_config_changed` ahora lo reusa en vez de tocar el `Map` privado directamente).

# Herramienta de depuración — `/cache` y `BOT_ENV`

**Ficheros:** [`src/commands/others/cache/`](../src/commands/others/cache/), [`src/systems/shared/Environment.ts`](../src/systems/shared/Environment.ts), [`src/systems/protection/GuildConfigCache.ts`](../src/systems/protection/GuildConfigCache.ts)

`/cache` inspecciona, calienta o invalida a mano la entrada de `GuildConfigCache` (ver `antiraid.md` sección 2) de un servidor. Herramienta interna, no pensada para un admin cualquiera.

## Por qué no hay una allowlist de staff

Se descartó gatear por lista de IDs: **producción, canary y desarrollo son aplicaciones de Discord distintas**, cada una con su propio token. Quien tiene el bot de producción nunca tiene `/cache` disponible — ni existe ahí. El control de acceso vive en **qué proceso es cada uno**, no en una lista de usuarios dentro de un único bot.

## `BOT_ENV` — production | canary | developing

`Environment.ts` expone `getBotEnvironment()`/`isProduction()`. Sin valor o valor no reconocido → se asume `production` (el fallo va siempre al lado restrictivo). Sustituye al viejo `TURN_ON_CANARY` (booleano) por algo más expresivo.

`canary` es el bot canario. `testing`, su nombre anterior, se sigue leyendo como `canary`: si cayera al valor por defecto, un canario arrancaría como producción. Y como `production` ahora también significa «habla con la web», un valor mal escrito (`canry`) avisa en el arranque (`unrecognizedBotEnv`, `[env] BOT_ENV=… is not production, canary or developing`) en lugar de pasar en silencio.

Cualquier comando puede marcarse `props: { devOnly: true }` ([`src/seyfert.d.ts`](../src/seyfert.d.ts)) para quedar fuera de producción.

## Solo producción habla con la web — `isProduction()`

Todo lo que habla con la web cuelga de `isProduction()` (`Environment.ts`): **`canary` y `developing` no tienen ninguna integración con ella**. Con `BOT_ENV` distinto de `production`:

- **`ApiServer` no arranca:** no abre el puerto, así que la web no tiene a quién llamar (y en la misma máquina que producción tampoco disputaría el puerto).
- **El soporte queda apagado entero:** `SupportConfig.get()` devuelve `null`. Índice, búfer, botón de cerrar, `channelDelete` y las rutas parten todos de esa configuración, así que ninguno necesita su propia comprobación. Un canal con pinta de ticket en el canario es un canal cualquiera: sus mensajes pasan por el automod. Tampoco se empuja ningún transcript.
- **`VerificationSystem.enforce` no manda enlaces** (llevarían a la web); se corta antes de consultar la base de datos.

**Lo que no cambia es la configuración del dashboard.** Vive en la base de datos compartida y llega a cada bot por `LISTEN/NOTIFY` hasta `GuildConfigCache`; no hay una conexión con la web de por medio. Cambiar una protección, el canal de logs o los ajustes de verificación en el dashboard afecta a `canary` y `developing` igual que a producción.

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

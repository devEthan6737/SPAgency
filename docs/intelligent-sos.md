# SOS al staff — `IntelligentSosSystem`

**Ficheros:** [`src/systems/intelligent-sos/IntelligentSosSystem.ts`](../src/systems/intelligent-sos/IntelligentSosSystem.ts), [`src/commands/moderation/sos.ts`](../src/commands/moderation/sos.ts), [`src/systems/antiraid/AntiraidSystem.ts`](../src/systems/antiraid/AntiraidSystem.ts)

Avisa al staff de SPAgency (canal `STAFF_LOGS_CHANNEL`) con una invitación fresca al servidor, de dos formas distintas que comparten el mismo mecanismo:

- **Manual — `/sos`**: un admin del servidor lo pulsa a propósito. Sin gate de config, sin cooldown — es un botón de pánico, no una detección.
- **Automático — `IntelligentSosSystem.trigger()`**: lo llama un sistema de detección cuando algo grave pasa. Gateado por `guild_protection.intelligentSosEnable` y con cooldown, para no reventar el canal de staff si el evento se repite.

## Por qué comparten código, no solo la idea

`/sos` ya existía en Seyfert antes de esta sesión con la lógica del aviso escrita directamente dentro del comando. En vez de reimplementar esa misma mecánica (elegir un canal de texto al azar, crear una invitación, mandar el mensaje al staff) para la parte automática, se extrajo a `IntelligentSosSystem.sendAlert(client, guildId, reason?)` — `/sos` ahora es un caller más de esa función (sin `reason`), igual que `trigger()` (con uno).

## `sendAlert` — por qué pide un `guildId`, no un `Guild`

Nada de lo que hace `sendAlert` necesita la estructura `Guild` completa (con sus calculadores de permisos, etc.) — solo el nombre del servidor y su lista de canales:

- **Canales**: `client.guilds.channels.list(guildId)` — ya es cache-first por sí solo.
- **Nombre**: `client.cache.guilds?.raw(guildId)` (dato crudo, sin transformar) con `client.guilds.fetch(guildId)` como único fallback si no está en caché — mismo principio que se aplicó (o se dejó pendiente, según el caso) en `RaidmodeSystem`/`MaliciousMemberSystem`.

Esto también simplifica la interfaz: `/sos` ya tiene el guild resuelto por el propio contexto del comando, solo pasa `ctx.guildId`; `trigger()` nunca tuvo un `Guild` de partida, solo el `guildId` con el que ya trabaja `AntiraidSystem`. Una sola firma sirve para los dos.

**Resultado discriminado, no `boolean`.** `sendAlert` puede fallar de dos formas distintas (no hay canal de staff configurado/accesible, o el servidor no tiene ningún canal de texto donde crear la invitación), y `/sos` necesita distinguirlas para mostrar el mensaje de error correcto. Devolver `'sent' | 'noStaffChannel' | 'noInviteChannel'` evita que el comando tenga que volver a pedir el canal de staff por su cuenta solo para saber cuál mostrar — `sendAlert` ya lo intentó una vez, ese resultado basta.

## `trigger()` — el gate, en el orden más barato primero

```ts
static async trigger(client: UsingClient, guildId: string, reason: string): Promise<void> {
    if (IntelligentSosSystem.cooldowns.has(guildId)) return;

    const settings = await GuildConfigCache.get(guildId);
    if (!settings?.intelligentSosEnable) return;

    // ...arma el cooldown, llama a sendAlert()
}
```

El cooldown (`Map.get()`, sin `await`, coste cero) se comprueba **antes** que `GuildConfigCache.get()` — aunque esa lectura es un acierto de caché en el caso común, sigue siendo una función `async` que resuelve en un microtask; comprobar primero lo síncrono evita ese coste en el caso más frecuente (cooldown ya activo). `intelligentSosEnable` vive en `GuildConfigCache`/`getProtectionSettings` como cualquier otro flag de protección — no una consulta suelta a Postgres, mismo criterio que llevó a cachear `logsChannel`/`language` para `dispatchLog`.

**Nunca se espera desde el llamador.** `AntiraidSystem.detect()` dispara `trigger()` con `void ...catch(() => {})`, exactamente igual que ya hace con `dispatchLog()` — el baneo (la única llamada de red que de verdad debe bloquear la respuesta) ya ha terminado antes de que esto se dispare, y las dos llamadas REST reales de `sendAlert()` (crear invite, mandar el mensaje) no retrasan nada aunque tarden.

## Cooldown en memoria, no en la base de datos

`intelligentSosCooldown` existía como booleano en `guild_protection`, pero un estado que dura 2 minutos no tiene sentido persistido — se sustituyó por un `Map<string, timer>` en la propia clase, con el mismo patrón self-cleaning que `BurstTracker`/`SelfbotSystem`: el timer se borra su propia entrada al expirar, nadie tiene que acordarse de limpiarlo.

## Dónde se engancha — solo `AntiraidSystem`, a propósito

`AntiraidSystem.detect()` llama a `trigger()` justo después de banear por ráfaga detectada, reusando el mismo `reason` (`t.systems.antiraid.banReason`) como motivo del aviso. Deliberadamente **no** está enganchado a:

- **`RaidmodeSystem`**: el dueño del servidor ya activó el lockdown él mismo — ya sabe que hay un problema, avisar al staff en cada baneo de raidmode sería ruido, no información nueva.
- **`AntibotsSystem`/`MaliciousMemberSystem`/`SelfbotSystem`**: expulsan/banean individuos de forma rutinaria y esperada. Ninguno es señal de que el bot esté desbordado — es exactamente lo que se supone que deben hacer, constantemente, sin que nadie del staff necesite enterarse.

`AntiraidSystem` sigue siendo el único caso real de "esto es grave y puede que nadie se haya enterado todavía", que es justo lo que `intelligentSOS` existe para cubrir.

## Idioma del aviso

El mensaje se construye en el idioma configurado del servidor (`client.t(settings.language)`), no en el del staff de SPAgency ni en el de quien pulsa `/sos` — mismo criterio que el resto de mensajes que no tienen un invocador humano directo delante (ver `logs.md`). Antes, `/sos` usaba `ctx.t` (el idioma del cliente de quien ejecuta el comando); se unificó al idioma del servidor al extraer la lógica compartida, coherente con cómo se construye cualquier otro mensaje de sistema en el resto del bot.

# SOS al staff — `IntelligentSosSystem`

**Ficheros:** [`src/systems/intelligent-sos/IntelligentSosSystem.ts`](../src/systems/intelligent-sos/IntelligentSosSystem.ts), [`src/commands/moderation/sos.ts`](../src/commands/moderation/sos.ts), [`src/systems/antiraid/AntiraidSystem.ts`](../src/systems/antiraid/AntiraidSystem.ts)

Avisa al staff de SPAgency (`STAFF_LOGS_CHANNEL`) con invitación fresca, de dos formas que comparten mecanismo:

- **Manual — `/sos`**: un admin lo pulsa a propósito. Sin gate, sin cooldown.
- **Automático — `IntelligentSosSystem.trigger()`**: lo llama un sistema de detección. Gateado por `intelligentSosEnable`, con cooldown.

## Por qué comparten código

La lógica de `/sos` (elegir canal, crear invite, mandar al staff) se extrajo a `sendAlert(client, guildId, reason?)` — `/sos` la llama sin `reason`, `trigger()` con uno.

## `sendAlert` — pide `guildId`, no `Guild`

No necesita la estructura `Guild` completa: canales vía `client.guilds.channels.list()` (cache-first), nombre vía `client.cache.guilds?.raw()` con `fetch()` como único fallback.

**Resultado discriminado, no `boolean`**: `'sent' | 'noStaffChannel' | 'noInviteChannel'` — `sendAlert` puede fallar de dos formas distintas y `/sos` necesita distinguirlas para el mensaje de error, sin repetir la búsqueda.

## `trigger()` — gate barato primero

```ts
static async trigger(client, guildId, reason) {
    if (IntelligentSosSystem.cooldowns.has(guildId)) return;
    const settings = await GuildConfigCache.get(guildId);
    if (!settings?.intelligentSosEnable) return;
    // arma el cooldown, llama a sendAlert()
}
```

El cooldown (`Map.get()`, sin `await`) se comprueba antes que la caché para evitar el coste de un microtask en el caso más frecuente (cooldown ya activo).

**Nunca se espera desde el llamador**: `AntiraidSystem.detect()` dispara con `void ...catch(() => {})`, igual que `dispatchLog()` — el ban ya terminó antes de esto.

## Cooldown en memoria

Antes era un booleano persistido en `guild_protection`; un estado de 2 minutos no tiene sentido en DB — ahora un [`ExpiringMap`](../src/systems/shared/ExpiringMap.ts) en la propia clase, se borra solo.

## Dónde se engancha — solo `AntiraidSystem`

Deliberadamente no en `RaidmodeSystem` (el owner ya sabe, sería ruido) ni en `AntibotsSystem`/`MaliciousMemberSystem`/`SelfbotSystem` (expulsiones rutinarias esperadas, no señal de desborde). `AntiraidSystem` es el único caso real de "esto es grave y puede que nadie se haya enterado".

## Idioma

El mensaje usa el idioma del servidor (`client.t(settings.language)`), no el de quien pulsa `/sos` ni el del staff — mismo criterio que cualquier mensaje sin invocador humano directo (ver `logs.md`).

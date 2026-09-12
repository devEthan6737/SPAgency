# Antiraid — filosofía y sistemas

Sistema de detección de ráfagas de SPAgency. El antibots (kick de bots al unirse) es hermano — comparte caché y logging, documentado aparte en [`antibots.md`](antibots.md).

## Filosofía

1. **Detectar y frenar sin depender de la red** — el camino caliente (cada evento del audit log) no espera HTTP ni DB, solo un `Map` en memoria.
2. **Frenar automáticamente, sin intervención humana** — el sistema banea solo, no se limita a avisar.
3. **Poder deshacer el daño después** (`/unnuke`, `/backup`) — ninguna detección es perfecta.

## 1. Detección de ráfagas — `AntiraidSystem` + `BurstTracker`

**Ficheros:** [`src/systems/antiraid/AntiraidSystem.ts`](../src/systems/antiraid/AntiraidSystem.ts), [`BurstTracker.ts`](../src/systems/antiraid/BurstTracker.ts)

`BurstTracker` es un contador de ráfaga genérico: cada `hit()` con la misma `key` suma uno sobre un [`ExpiringMap`](../src/systems/shared/ExpiringMap.ts) (ver `moderation.md`) que se autolimpia sin más hits. Al llegar al `threshold` dentro de `windowMs`, devuelve `true` una vez y se resetea explícitamente.

`AntiraidSystem.detect()` usa un contador **por servidor** (no por tipo de acción), `threshold=3`, `windowMs=10_000` — un raid que mezcla canales y roles debe contar como una sola ráfaga.

No todos los hits valen igual: `weightFor()` pondera doble un canal creado con nombre duplicado (comprobado contra caché, sin red — patrón típico de raid) para que la ráfaga salte antes. El efecto está acotado: solo adelanta *cuándo* salta el umbral, nunca lo baja para el resto.

Dos guards antes de contar: el ejecutor es el propio bot (`executorId === client.botId`, si no, restaurar un backup se autobanearía), o `antiraidEnable`/`whitelist` descartan la acción.

Al saltar, banea al causante y registra `ServerEventLog` (`private static log()` propio, mismo patrón que `AntibotsSystem`). Si el causante es un bot, banea también a quien lo añadió — ver [`bot-adder.md`](bot-adder.md).

## 2. Config sin red — `GuildConfigCache`

**Fichero:** [`src/systems/protection/GuildConfigCache.ts`](../src/systems/protection/GuildConfigCache.ts)

`Map<guildId, GuildSettings>` en memoria, fallback a `GuildRepository.getGuildSettings` (sin joins de más). Vive en `src/systems/protection/`, no en `antiraid/`, porque también la usan antibots y `AutomodSystem`.

**Invalidación vive en Postgres, no en el bot**: `guild_protection`/`guild_configuration` tienen un trigger `pg_notify('guild_config_changed', guild_id)` en cualquier `UPDATE`, de cualquier proceso. El bot hace `LISTEN` y borra la entrada — la dashboard no necesita avisar de nada. Red de seguridad: `setInterval` que vacía toda la caché cada 10 minutos. Para inspeccionarla a mano, ver [`cache.md`](cache.md).

**Por qué no se mueve a Redis, ni en la misma VPS:** `BurstTracker`/`GuildConfigCache` están en el camino de decisión de un ban — Redis en localhost sigue siendo una petición de red (socket, serialización), reintroduciendo la latencia que la idea 1 existe para evitar. Se queda en proceso salvo sharding real con estado compartido entre procesos (y aun así, cada guild siempre lo procesa el mismo shard).

## 3. Punto de entrada único — `guildAuditLogEntryCreate`

**Fichero:** [`src/events/guildAuditLogEntryCreate.ts`](../src/events/guildAuditLogEntryCreate.ts)

Seyfert solo permite un handler por evento — un segundo `createEvent` reemplazaría al primero en silencio. Todo lo que dependa del audit log vive aquí. Sustituye al polling REST del legacy: `guildAuditLogEntryCreate` es gateway real, el `executorId` llega directo.

El handler: (1) si la acción importa al detector de ráfagas, llama a `AntiraidSystem.detect()`; (2) si el ejecutor no es el bot, traduce a `ServerEventLog` y despacha. El orden importa — antiraid va primero para que nada más lo retrase.

## 4. Logging — `BotActionLog` vs `ServerEventLog`

La detección registra `ServerEventLog` (`RaidDetected`), no `BotActionLog` — nadie pidió la acción con un comando. Detalle completo en [`logs.md`](logs.md).

## 5. Recuperación — `/unnuke` y `/backup`

**Ficheros:** [`src/commands/configuration/unnuke/`](../src/commands/configuration/unnuke/), [`src/systems/backup/BackupSystem.ts`](../src/systems/backup/BackupSystem.ts)

- **`/unnuke bans|channels|roles|emojis`**: `bans` desbanea a todos; el resto borra duplicados por nombre (`UnnukeHelpers.deleteDuplicates`). Cooldown por subcomando, grupo compartido.
- **`/backup create|load|delete|info`**: snapshot completo, restaurable si `/unnuke` no basta. Descargas de imágenes secuenciales, no en paralelo, para no saturar el CDN de Discord.

Ambos generan `BotActionLog` y pasan por `Confirmation.ask()` antes de ejecutar, por destructivos.

## 6. Prerrequisitos — `AntiraidPrerequisites`

**Ficheros:** [`src/systems/antiraid/AntiraidPrerequisites.ts`](../src/systems/antiraid/AntiraidPrerequisites.ts), [`guildRoleUpdate.ts`](../src/events/guildRoleUpdate.ts), [`guildRoleDelete.ts`](../src/events/guildRoleDelete.ts), [`guildMemberUpdate.ts`](../src/events/guildMemberUpdate.ts)

`meets()` comprueba tres cosas sin excepción: permiso **Ban Members**, permiso **View Audit Log** (sin él, Discord ni dispara el evento), y rol del bot en la **posición más alta** de la jerarquía. Las tres salen de caché de gateway, cero red.

**No es un timer** — `recheckPrerequisites()` se llama desde los tres eventos que pueden romper esto (`guildRoleUpdate`, `guildRoleDelete`, `guildMemberUpdate` filtrado al propio bot), no desde un `setInterval`. El único caso que ningún evento cubre es el cambio mientras el bot estaba desconectado — para eso, `recheckAllPrerequisites()` corre en cada `ready` (cada sesión de gateway nueva, no solo el arranque).

Si algo falla, `disable()` apaga `antiraidEnable` y loguea `AntiraidDisabled` — nunca queda activado-pero-inerte. La dashboard, cuando exista, solo refleja lo que dice el bot.

## Lo que falta / se descartó

Ya no queda ninguna columna de `guild_protection` sin implementar: `antibots`, `maliciousMemberAction`, `raidmode`, `selfbot`, `intelligentSOS`, `verification` — ver sus docs respectivos. `guild_moderation` también está hecho (ver [`moderation.md`](moderation.md)).

Eliminado sin sustituto directo: `antijoins` (raidmode lo cubre mejor), `intelligentAntiflood` (se solapaba con `antiflood` básico), `bloqEntritiesByName`/`antitokens`/`bloqNewCreatedUsers` (sustituidos por `SelfbotSystem`). `purgeWebhooksAttacks`/`antiflood` se movieron a `guild-moderation.ts` — son conducta de chat, no defensa estructural.

**Descartado**: `AntiraidSystem` contando `BotAdd` hacia el contador de ráfaga, con peso extra si la cuenta es nueva. Descartado porque `VerifiedBot` no garantiza nada (Discord verifica sin revisión real de comportamiento) y la antigüedad de cuenta ya la pesa `SelfbotSystem` — duplicaría lógica.

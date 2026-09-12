# Miembros maliciosos — `MaliciousMemberSystem`

Qué hace el bot cuando un usuario marcado como malicioso en UBFB (blacklist global, `src/systems/ubfb/`) se une. **Fichero:** [`src/systems/malicious-members/MaliciousMemberSystem.ts`](../src/systems/malicious-members/MaliciousMemberSystem.ts) — vive en `guildMemberAdd`, junto a `AntibotsSystem`.

## `MaliciousMemberAction`

**Fichero:** [`src/database/schema/guild-protection.ts`](../src/database/schema/guild-protection.ts)

Un enum (`None | Mark | Ban`) en vez de los dos booleanos independientes del legacy (`markMaliciousEnable`/`kickMaliciousEnable`, activables a la vez sin sentido coherente).

No hay `warnEntry` aparte: el DM al owner pasa incondicionalmente en `Mark`/`Ban`, sin flag propio que mantener sincronizado.

## Qué pasa en cada caso

El join **siempre** se registra (`ServerEventLog`, automático), incluso con `None`.

- **`None`**: nada más.
- **`Mark`**: DM al owner + cambia el apodo al motivo. Si falla el permiso o la jerarquía, el cambio de apodo se salta en silencio (log y DM siguen).
- **`Ban`**: DM al owner + ban directo. No es un kick: un kick deja la puerta abierta a reintentar de inmediato, con ventana de carrera en el propio handler del join. Ban de una vez quita ese riesgo, sin escalera que acertar.

**Excepción incondicional: un bot malicioso siempre se banea**, sin consultar `maliciousMemberAction`. No tiene sentido "marcar y dejar entrar" a un bot que además de estar en la blacklist global, se coló más allá de `AntibotsSystem`. Ese ban arrastra también a quien lo añadió — ver [`bot-adder.md`](bot-adder.md).

## Orden con `AntibotsSystem` — corre antes

**Fichero:** [`src/events/guildMemberAdd.ts`](../src/events/guildMemberAdd.ts)

```ts
if (await MaliciousMemberSystem.enforce(client, member)) return;
if (await AntibotsSystem.enforce(client, member)) return;
await SelfbotSystem.enforce(client, member);
```

El orden importa: si antibots corriera primero, un bot bloqueado genéricamente por antibots y también en blacklist UBFB solo se expulsaría (kick) — `MaliciousMemberSystem` nunca llegaría a correr, rompiendo la garantía de "bot malicioso siempre baneado" justo en el caso más común (bots no verificados). Invertir por rendimiento no compensa: `ubfb.isBlacklisted()` es tan local como el check de antibots; la única llamada de red (`getBlacklistEntry`) solo ocurre con el usuario ya confirmado malicioso.

## Por qué se podó de 4 variantes a 3

El legacy `markmalicious.js` tenía 4 variantes para "marcar": apodo, rol, log al canal, DM al owner. Solo el apodo sobrevive como config real de `Mark` — el DM ya es incondicional, el log al canal ya pasa siempre para las tres acciones, y añadir rol nunca se usó de verdad (descartado sin más). Sin esas tres, `Mark` no tiene nada que configurar.

## Consulta de blacklist — sin red en el caso común

`getUbfb().isBlacklisted(userId)` es local (caché sincronizada por WebSocket) — el 99.9% de los joins no toca la red. Solo con un hit se busca el motivo completo: primero caché (`getCachedEntry`), si no está, una única llamada REST puntual (aceptable aquí, sin ráfaga que proteger).

## Estado del bundle

Pieza del bundle de join junto a `AntibotsSystem`, `SelfbotSystem` y `VerificationSystem` — completo. `antijoins` se eliminó (raidmode lo cubre mejor); `bloqEntritiesByName`/`antitokens`/`bloqNewCreatedUsers` también, sustituidos por `SelfbotSystem`.

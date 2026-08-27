import type { UsingClient } from 'seyfert';
import { BurstTracker } from './BurstTracker.js';
import { GuildConfigCache } from './GuildConfigCache.js';

/** How many flagged actions within the window count as a raid. */
const BURST_THRESHOLD = 3;
/** Rolling window: each new flagged action resets it, so the threshold is "N actions within this long of each other". */
const BURST_WINDOW_MS = 10_000;

export interface AntiraidDetectOptions {
    client: UsingClient;
    guildId: string;
    executorId: string;
}

/**
 * Detects raid-style bursts (channels/roles spammed or deleted, mass bans) and bans whoever's
 * behind them. One shared counter per guild — a raid mixing channel and role spam still trips it,
 * matching the legacy bot's behavior.
 */
export class AntiraidSystem {
    /** Call for a flagged audit log entry (channel/role create-delete, ban add) — `executorId` comes straight off the gateway payload, no REST lookup needed. */
    static async detect({ client, guildId, executorId }: AntiraidDetectOptions): Promise<void> {
        const settings = await GuildConfigCache.get(guildId);
        if (!settings?.antiraidEnable) return;
        if (settings.whitelist.includes(executorId)) return;

        const tripped = BurstTracker.hit({ key: guildId, threshold: BURST_THRESHOLD, windowMs: BURST_WINDOW_MS });
        if (!tripped) return;

        const t = client.t(settings.language);
        await client.bans.create(guildId, executorId, { reason: t.systems.antiraid.banReason.get() }).catch(() => {});
    }
}

import { ExpiringMap } from '../shared/ExpiringMap.js';

export interface BurstHitOptions {
    /** Identifies what's being tracked — e.g. a guild id. */
    key: string;
    /** How many hits within the window trip the burst. */
    threshold: number;
    /** Rolling window in ms — each hit resets it, so it's really "N hits within this long of each other". */
    windowMs: number;
    /** How much this hit counts toward the threshold — some signals are stronger than others. Defaults to 1. */
    weight?: number;
}

/** Generic rolling-window burst counter, keyed by an arbitrary string. Not specific to antiraid. */
export class BurstTracker {
    private static entries = new ExpiringMap<string, number>();

    /** Registers a hit (worth `weight`, default 1) for `key`. Returns true once `threshold` is reached within `windowMs` of the last hit, and resets the counter. */
    static hit({ key, threshold, windowMs, weight = 1 }: BurstHitOptions): boolean {
        const count = (BurstTracker.entries.get(key) ?? 0) + weight;
        if (count >= threshold) {
            BurstTracker.entries.delete(key);
            return true;
        }

        BurstTracker.entries.set(key, count, { ttlMs: windowMs });
        return false;
    }
}

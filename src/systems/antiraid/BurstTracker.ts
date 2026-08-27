export interface BurstHitOptions {
    /** Identifies what's being tracked — e.g. a guild id. */
    key: string;
    /** How many hits within the window trip the burst. */
    threshold: number;
    /** Rolling window in ms — each hit resets it, so it's really "N hits within this long of each other". */
    windowMs: number;
}

/** Generic rolling-window burst counter, keyed by an arbitrary string. Not specific to antiraid. */
export class BurstTracker {
    private static entries = new Map<string, { count: number; timer: NodeJS.Timeout }>();

    /** Registers one hit for `key`. Returns true once `threshold` hits land within `windowMs` of each other, and resets the counter. */
    static hit({ key, threshold, windowMs }: BurstHitOptions): boolean {
        const existing = BurstTracker.entries.get(key);
        if (existing) clearTimeout(existing.timer);

        const count = (existing?.count ?? 0) + 1;
        if (count >= threshold) {
            BurstTracker.entries.delete(key);
            return true;
        }

        const timer = setTimeout(() => BurstTracker.entries.delete(key), windowMs);
        BurstTracker.entries.set(key, { count, timer });
        return false;
    }
}

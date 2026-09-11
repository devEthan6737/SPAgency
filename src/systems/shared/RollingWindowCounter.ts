interface Entry {
    timestamps: number[];
    /** Unset only for a brand-new entry, before its first `hit()` schedules one. */
    reapTimer?: NodeJS.Timeout;
}

/**
 * "How many hits for `key` in the last `windowMs`?" — a continuous rolling count, not a trip-once
 * counter like `BurstTracker`. `BurstTracker.hit()` resets to zero the moment it trips, which is right
 * for "ban the one responsible for tripping this" (antiraid) but wrong for "flag every message in an
 * ongoing flood", where each additional message past the threshold still needs to read as a hit, not
 * restart the count from scratch. Generalizes the rolling counter `SelfbotSystem` hand-rolled for its
 * join-burst signal — a second real use (message/webhook flood in `AutomodSystem`) made it worth
 * extracting instead of copy-pasting a third time.
 *
 * Each key's entry reaps itself once nothing hits it for a full window — same self-cleaning pattern as
 * `BurstTracker`/`LogChannelThrottle`, nothing sits in the `Map` forever just for having been touched once.
 */
export class RollingWindowCounter {
    private entries = new Map<string, Entry>();

    constructor(private readonly windowMs: number) {}

    /** Registers a hit for `key` and returns how many hits it has within the window, including this one. */
    hit(key: string): number {
        const now = Date.now();
        const entry = this.entries.get(key) ?? { timestamps: [] };

        entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < this.windowMs);
        entry.timestamps.push(now);

        if (entry.reapTimer) clearTimeout(entry.reapTimer);
        entry.reapTimer = setTimeout(() => this.entries.delete(key), this.windowMs);
        this.entries.set(key, entry);

        return entry.timestamps.length;
    }
}

/**
 * A `Map` where every entry deletes itself after `ttlMs` unless refreshed — the "self-cleaning" dance
 * (clear the old timer if there was one, schedule a new one, delete on fire) that kept getting
 * hand-rolled slightly differently across the codebase: `BurstTracker`, `RollingWindowCounter`,
 * `LogChannelThrottle`, `AutomodSystem`'s ghostping candidates, `IntelligentSosSystem`'s cooldowns, and
 * `RaidmodeExpiry`'s per-guild timers all needed exactly this, each with its own copy of the same few
 * lines. One shared primitive here instead of a sixth (seventh, eighth...) copy.
 *
 * Deliberately minimal — no iteration, no size, nothing beyond what every one of those six actually
 * used. `RaidmodeExpiry` in particular needs `onExpire` (it must *act* when a guild's raidmode timer
 * elapses, not just quietly drop a cache entry), so that's supported everywhere rather than adding a
 * second, one-off primitive just for that case.
 */
export class ExpiringMap<K, V> {
    private entries = new Map<K, { value: V; timer: NodeJS.Timeout }>();

    /**
     * Stores `value` for `key`, replacing any existing entry and its timer — calling `set` again for
     * the same key restarts its `ttlMs`, it doesn't stack a second timer on top.
     * @param onExpire Called once, right after the entry is removed, if `key` is still untouched when `ttlMs` elapses.
     */
    set(key: K, value: V, ttlMs: number, onExpire?: (key: K, value: V) => void): void {
        const existing = this.entries.get(key);
        if (existing) clearTimeout(existing.timer);

        const timer = setTimeout(() => {
            this.entries.delete(key);
            onExpire?.(key, value);
        }, ttlMs);

        this.entries.set(key, { value, timer });
    }

    /** Current value for `key`, or `undefined` if absent or already expired. Does not affect its `ttlMs`. */
    get(key: K): V | undefined {
        return this.entries.get(key)?.value;
    }

    /** Whether `key` currently has a live (unexpired) entry. */
    has(key: K): boolean {
        return this.entries.has(key);
    }

    /** Removes `key` immediately, canceling its timer — `onExpire` never runs for a key removed this way. */
    delete(key: K): boolean {
        const existing = this.entries.get(key);
        if (existing) clearTimeout(existing.timer);
        return this.entries.delete(key);
    }
}

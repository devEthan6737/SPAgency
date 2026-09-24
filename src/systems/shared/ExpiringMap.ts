/** Options for {@link ExpiringMap.set} beyond the key and value. */
export interface ExpiringMapEntryOptions<K, V> {
    /** How long, in ms, the value stays before it self-deletes. */
    ttlMs: number;
    /** Called once, right after the entry is removed, if the key is still untouched when `ttlMs` elapses. */
    onExpire?: (key: K, value: V) => void;
}

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
     * @param key The key to store under.
     * @param value The value to store.
     * @param options How long it lives and, if needed, what to do once it expires.
     */
    set(key: K, value: V, { ttlMs, onExpire }: ExpiringMapEntryOptions<K, V>): void {
        const existing = this.entries.get(key);
        if (existing) clearTimeout(existing.timer);

        const timer = setTimeout(() => {
            this.entries.delete(key);
            onExpire?.(key, value);
        }, ttlMs);

        this.entries.set(key, { value, timer });
    }

    /**
     * Reads the current value for a key.
     * @param key The key to look up.
     * @returns The value, or `undefined` if absent or already expired. Does not affect its `ttlMs`.
     */
    get(key: K): V | undefined {
        return this.entries.get(key)?.value;
    }

    /**
     * Checks whether a key is still live.
     * @param key The key to check.
     * @returns Whether it currently has a live (unexpired) entry.
     */
    has(key: K): boolean {
        return this.entries.has(key);
    }

    /**
     * Removes a key immediately, canceling its timer — `onExpire` never runs for a key removed this way.
     * @param key The key to remove.
     * @returns Whether it was present.
     */
    delete(key: K): boolean {
        const existing = this.entries.get(key);
        if (existing) clearTimeout(existing.timer);
        return this.entries.delete(key);
    }
}

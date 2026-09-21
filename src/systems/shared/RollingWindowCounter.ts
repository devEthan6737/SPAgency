import { ExpiringMap } from './ExpiringMap.js';

/**
 * "How many hits for `key` in the last `windowMs`?" — a continuous rolling count, not a trip-once
 * counter like `BurstTracker`. `BurstTracker.hit()` resets to zero the moment it trips, which is right
 * for "ban the one responsible for tripping this" (antiraid) but wrong for "flag every message in an
 * ongoing flood", where each additional message past the threshold still needs to read as a hit, not
 * restart the count from scratch. Generalizes the rolling counter `SelfbotSystem` hand-rolled for its
 * join-burst signal — a second real use (message/webhook flood in `AutomodSystem`) made it worth
 * extracting instead of copy-pasting a third time.
 *
 * Each key's entry reaps itself once nothing hits it for a full window, via `ExpiringMap` — same
 * self-cleaning guarantee as before, just without hand-rolling the timer dance here too.
 */
export class RollingWindowCounter {
    private entries = new ExpiringMap<string, number[]>();

    /** @param windowMs Size of the rolling window, in ms, that {@link hit} counts within. */
    constructor(private readonly windowMs: number) {}

    /** Registers a hit for `key` and returns how many hits it has within the window, including this one. */
    hit(key: string): number {
        const now = Date.now();
        const timestamps = (this.entries.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs);
        timestamps.push(now);

        this.entries.set(key, timestamps, this.windowMs);
        return timestamps.length;
    }

    /**
     * How many hits `key` has within the window, without registering one — for checking a limit before deciding to act.
     * @param key What is being counted.
     * @returns The number of hits within the last `windowMs`.
     */
    count(key: string): number {
        const now = Date.now();
        return (this.entries.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs).length;
    }
}

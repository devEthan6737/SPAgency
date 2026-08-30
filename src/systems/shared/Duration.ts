const unitsMs: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };

/**
 * `'1d'`/`'30m'`/... → ms. Falls back to a day if `value` doesn't parse — better a safe default than
 * an instant expiry/disable. Shared by `RaidmodeSystem`/`RaidmodeExpiry` and `SelfbotSystem`, the
 * places that store a duration as free text. No `ms` package installed (the legacy bot's dependency)
 * — not worth adding one for a format this simple.
 */
export function parseDurationMs(value: string): number {
    const match = /^(\d+)\s*(s|m|h|d|w)$/i.exec(value.trim());
    if (!match) return unitsMs.d;

    return Number(match[1]) * unitsMs[match[2].toLowerCase()];
}

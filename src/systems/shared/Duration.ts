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

/** The words a locale uses to spell a duration out: singular and plural of each unit, and the last-item conjunction. */
export interface DurationWords {
    day: string;
    days: string;
    hour: string;
    hours: string;
    minute: string;
    minutes: string;
    second: string;
    seconds: string;
    /** Joins the last two parts: "y" gives "3 horas y 5 minutos". */
    and: string;
}

/**
 * Spells a duration out in days, hours, minutes and seconds, skipping the units that are zero:
 * `1 minuto y 30 segundos`, `1 día, 3 horas, 30 minutos y 49 segundos`. Under a second it says
 * `0 segundos` rather than nothing.
 * @param ms The duration in milliseconds; fractions of a second are dropped.
 * @param words The unit names and conjunction of the language to write it in.
 * @returns The duration as text.
 */
export function formatDuration(ms: number, words: DurationWords): string {
    const total = Math.max(0, Math.floor(ms / 1_000));
    const amounts: [number, string, string][] = [
        [Math.floor(total / 86_400), words.day, words.days],
        [Math.floor(total / 3_600) % 24, words.hour, words.hours],
        [Math.floor(total / 60) % 60, words.minute, words.minutes],
        [total % 60, words.second, words.seconds]
    ];

    const parts = amounts.filter(([amount]) => amount > 0).map(([amount, one, many]) => `${amount} ${amount === 1 ? one : many}`);
    if (!parts.length) return `0 ${words.seconds}`;
    if (parts.length === 1) return parts[0];

    return `${parts.slice(0, -1).join(', ')} ${words.and} ${parts[parts.length - 1]}`;
}

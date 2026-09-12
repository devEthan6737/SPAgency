/** Pure, stateless checks against a single message's own content/shape — no config, no side effects, nothing async. `AutomodSystem.detect()` decides which of these to run and against which thresholds. */
export class AutomodContentDetectors {
    /** Below this many non-space characters, `isMostlyCaps` never trips — "OK", "LOL" etc. would otherwise trip it constantly on pure noise. */
    private static readonly CapsLockMinLength = 10;

    /** Counts whitespace-separated words in `content`. */
    static countWords(content: string): number {
        return content.split(/\s+/).filter(Boolean).length;
    }

    /** Custom Discord emoji (`<a?:name:id>`) plus a broad-enough Unicode emoji range — loose on purpose, matching `SelfbotSystem`'s "don't try to nail the pattern exactly" precedent. */
    static countEmojis(content: string): number {
        const custom = content.match(/<a?:\w+:\d+>/g) ?? [];
        const unicode = content.match(/\p{Extended_Pictographic}/gu) ?? [];
        return custom.length + unicode.length;
    }

    /** Whether at least `thresholdPercent` of `content`'s letters are uppercase — always `false` under {@link AutomodContentDetectors.CapsLockMinLength} letters. */
    static isMostlyCaps(content: string, thresholdPercent: number): boolean {
        const letters = content.replace(/[^a-zA-Z]/g, '');
        if (letters.length < AutomodContentDetectors.CapsLockMinLength) return false;

        const upper = letters.replace(/[^A-Z]/g, '');
        return (upper.length / letters.length) * 100 >= thresholdPercent;
    }
}

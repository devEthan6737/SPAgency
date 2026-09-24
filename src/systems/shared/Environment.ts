export enum BotEnvironment {
    /** The real bot, the one in every server it's actually meant to protect. */
    Production = 'production',
    /** The canary bot — a separate Discord application, added knowingly by testers to their own servers. */
    Canary = 'canary',
    /** A developer's own machine, with essentially no invite beyond their own single test server. */
    Developing = 'developing'
}

/**
 * `BOT_ENV` — defaults to {@link BotEnvironment.Production} when unset, on purpose: an unrecognized
 * or missing value should fail toward the most restrictive behavior (no dev-only commands exposed),
 * never toward the most permissive one. `testing`, the old name of `canary`, still reads as `canary`:
 * left to fall through to production it would put a canary bot on the web.
 * @returns The environment this process runs as.
 */
export function getBotEnvironment(): BotEnvironment {
    const value = process.env.BOT_ENV;
    if (value === BotEnvironment.Canary || value === 'testing') return BotEnvironment.Canary;

    return value === BotEnvironment.Developing ? value : BotEnvironment.Production;
}

/**
 * A `BOT_ENV` that is set but is none of the environments — a typo such as `canry`. It is read as
 * production, which now also means "talks to the web", so this exists to make that visible at startup.
 * @returns The offending value, or `undefined` if `BOT_ENV` is unset, empty or valid.
 */
export function unrecognizedBotEnv(): string | undefined {
    const value = process.env.BOT_ENV;
    const known = [BotEnvironment.Production, BotEnvironment.Canary, BotEnvironment.Developing, 'testing'];

    return value && !known.includes(value as BotEnvironment) ? value : undefined;
}

/**
 * Shorthand for `getBotEnvironment() === BotEnvironment.Production`. Besides hiding the dev-only commands,
 * this is the gate for everything that talks to SPA's web — the API the web calls (`ApiServer`), support
 * tickets and their transcripts, verification links: only the real bot has any of it. The canary bot
 * and a developer's own machine never do; the web's *configuration*, though, still reaches them, since
 * it lives in the shared database and travels by `LISTEN/NOTIFY`, not through any connection to the web.
 * @returns Whether this is the real bot.
 */
export function isProduction(): boolean {
    return getBotEnvironment() === BotEnvironment.Production;
}

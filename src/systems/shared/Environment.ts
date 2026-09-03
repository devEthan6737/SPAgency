export enum BotEnvironment {
    /** The real bot, the one in every server it's actually meant to protect. */
    Production = 'production',
    /** The canary bot — a separate Discord application, added knowingly by testers to their own servers. */
    Testing = 'testing',
    /** A developer's own machine, with essentially no invite beyond their own single test server. */
    Developing = 'developing'
}

/**
 * `BOT_ENV` — defaults to {@link BotEnvironment.Production} when unset, on purpose: an unrecognized
 * or missing value should fail toward the most restrictive behavior (no dev-only commands exposed),
 * never toward the most permissive one.
 */
export function getBotEnvironment(): BotEnvironment {
    const value = process.env.BOT_ENV;
    return value === BotEnvironment.Testing || value === BotEnvironment.Developing ? value : BotEnvironment.Production;
}

export function isProduction(): boolean {
    return getBotEnvironment() === BotEnvironment.Production;
}

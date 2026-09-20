/** Everything the support system reads from the environment — see docs/support.md for what each variable is. `webUrl` and `webApiKey` are the shared `WEB_URL` and `INTERNAL_API_KEY`: where and how the bot calls the web. `staffChannelId` is the shared `STAFF_LOGS_CHANNEL`, where transcript copies and delivery failures go. */
export interface SupportSettings {
    guildId: string;
    categoryId: string;
    staffRoleId: string;
    staffChannelId: string;
    webUrl: string;
    webApiKey: string;
}

/** Reads and caches the support variables — the `SUPPORT_*` ones plus the shared `WEB_URL`, `INTERNAL_API_KEY` and `STAFF_LOGS_CHANNEL`. The whole feature is off unless every one of them is set. */
export class SupportConfig {
    private static cached: SupportSettings | null | undefined;

    /** Names of the required variables that are unset or empty. */
    static missing(): string[] {
        return [
            'SUPPORT_GUILD_ID',
            'SUPPORT_CATEGORY_ID',
            'SUPPORT_STAFF_ROLE_ID',
            'STAFF_LOGS_CHANNEL',
            'WEB_URL',
            'INTERNAL_API_KEY'
        ].filter((name) => !process.env[name]);
    }

    /**
     * The settings, or `null` while anything in {@link SupportConfig.missing} is unset.
     * Cached after the first call — the environment doesn't change while the process runs.
     */
    static get(): SupportSettings | null {
        if (SupportConfig.cached !== undefined) return SupportConfig.cached;
        if (SupportConfig.missing().length) return (SupportConfig.cached = null);

        // Safe: `missing()` just confirmed every one of these is set.
        const env = process.env as Record<string, string>;
        return (SupportConfig.cached = {
            guildId: env.SUPPORT_GUILD_ID,
            categoryId: env.SUPPORT_CATEGORY_ID,
            staffRoleId: env.SUPPORT_STAFF_ROLE_ID,
            staffChannelId: env.STAFF_LOGS_CHANNEL,
            webUrl: env.WEB_URL,
            webApiKey: env.INTERNAL_API_KEY
        });
    }
}

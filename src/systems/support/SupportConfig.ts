/** Everything the support system reads from the environment — see docs/support.md for what each variable is. */
export interface SupportSettings {
    guildId: string;
    categoryId: string;
    staffRoleId: string;
    transcriptsChannelId: string;
    webUrl: string;
    webApiKey: string;
}

/** Reads and caches the `SUPPORT_*` variables. The whole feature is off unless every one of them is set. */
export class SupportConfig {
    private static cached: SupportSettings | null | undefined;

    /** Names of the required variables that are unset or empty. `SUPPORT_API_KEY` is checked here too: it only authenticates the web's calls, so it isn't part of {@link SupportSettings}. */
    static missing(): string[] {
        return [
            'SUPPORT_API_KEY',
            'SUPPORT_GUILD_ID',
            'SUPPORT_CATEGORY_ID',
            'SUPPORT_STAFF_ROLE_ID',
            'SUPPORT_TRANSCRIPTS_CHANNEL_ID',
            'SUPPORT_WEB_URL',
            'SUPPORT_WEB_API_KEY'
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
            transcriptsChannelId: env.SUPPORT_TRANSCRIPTS_CHANNEL_ID,
            webUrl: env.SUPPORT_WEB_URL,
            webApiKey: env.SUPPORT_WEB_API_KEY
        });
    }
}

/**
 * Everything the support system reads from the environment — see docs/support.md for what each
 * variable is. `webUrl` and `webApiKey` are the shared `WEB_URL` and `INTERNAL_API_KEY`: where and
 * how the bot calls the web. `staffChannelId` is the shared `STAFF_LOGS_CHANNEL`, where transcript
 * copies and delivery failures go.
 */
export interface SupportSettings {
    /** Guild where the tickets live. */
    guildId: string;
    /** Category of that guild whose channels are the tickets. */
    categoryId: string;
    /** Role that sees and answers tickets, and may close them. */
    staffRoleId: string;
    /** Channel that receives the staff's transcript copies and the delivery-failure alerts. */
    staffChannelId: string;
    /** Base URL of the web, for the calls the bot makes to it. */
    webUrl: string;
    /** Key the bot authenticates with when calling the web. */
    webApiKey: string;
}

/** Reads and caches the support variables — the `SUPPORT_*` ones plus the shared `WEB_URL`, `INTERNAL_API_KEY` and `STAFF_LOGS_CHANNEL`. The whole feature is off unless every one of them is set. */
export class SupportConfig {
    /** `undefined` until the first {@link SupportConfig.get}; `null` once it found something missing. */
    private static cached: SupportSettings | null | undefined;

    /**
     * Lists the required variables that aren't usable.
     * @returns Names of the variables that are unset or empty — an empty list means support is fully configured.
     */
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
     * Lists the variables that are set but unusable. `WEB_URL` carries `INTERNAL_API_KEY` on every
     * call the bot makes to it, so it must be `https`, or plain `http` only towards this machine.
     * @returns A description of each problem — an empty list means nothing is wrong.
     */
    static invalid(): string[] {
        const url = process.env.WEB_URL;
        return url && !SupportConfig.isSafeWebUrl(url) ? ['WEB_URL must be https, or http on a loopback address: it carries INTERNAL_API_KEY'] : [];
    }

    /**
     * Reads the settings. Cached after the first call — the environment doesn't change while the
     * process runs — so it is cheap enough to call on the hot path of every message event.
     * @returns The settings, or `null` while anything in {@link SupportConfig.missing} is unset or {@link SupportConfig.invalid} reports a problem.
     */
    static get(): SupportSettings | null {
        if (SupportConfig.cached !== undefined) return SupportConfig.cached;
        if (SupportConfig.missing().length || SupportConfig.invalid().length) return (SupportConfig.cached = null);

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

    /**
     * Whether a URL can safely carry the shared key.
     * @param value The URL to check.
     * @returns `true` for `https`, or for `http` towards `localhost` or a `127.x.x.x` / `::1` address.
     */
    private static isSafeWebUrl(value: string): boolean {
        try {
            const { protocol, hostname } = new URL(value);
            if (protocol === 'https:') return true;

            return protocol === 'http:' && (hostname === 'localhost' || hostname === '[::1]' || /^127\./.test(hostname));
        } catch {
            return false;
        }
    }
}

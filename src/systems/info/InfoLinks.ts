import { PermissionFlagsBits } from 'seyfert';

/** The links `/info` can show. */
export enum InfoLinkKind {
    InviteBot = 'inviteBot',
    Support = 'support',
    Donate = 'donate',
    GitHub = 'github',
    Web = 'web'
}

/** One link to show. Every link is always shown; one whose address is not configured has no `url` and is drawn disabled. */
export interface InfoLink {
    kind: InfoLinkKind;
    url: string | undefined;
}

/** The links split by how much they matter: the priority ones get buttons, the secondary ones a line of small text. */
export interface InfoLinkGroups {
    priority: InfoLink[];
    secondary: InfoLink[];
}

/**
 * Works out the links `/info` shows. Only the repository is fixed in code, since it never changes; the
 * rest come from the environment. The five links always appear: one whose variable is missing, or is
 * not an http(s) URL, comes back without a `url` and is drawn disabled, because a bad URL on a link
 * button makes Discord reject the whole message.
 */
export class InfoLinks {
    /** The bot's repository. */
    static readonly GitHubUrl = 'https://github.com/devEthan6737/SPAgency';

    /**
     * @param applicationId The id of the running application, so each of production, canary and developing links to its own bot.
     * @returns All the links. Priority: invite the bot, the support server, donate. Secondary: GitHub, the web.
     */
    static resolve(applicationId: string): InfoLinkGroups {
        const web = InfoLinks.webUrl();

        return {
            priority: [
                { kind: InfoLinkKind.InviteBot, url: InfoLinks.inviteUrl(applicationId) },
                { kind: InfoLinkKind.Support, url: InfoLinks.validUrl(process.env.SUPPORT_INVITE_URL) },
                { kind: InfoLinkKind.Donate, url: web && `${web}/donate` }
            ],
            secondary: [
                { kind: InfoLinkKind.GitHub, url: InfoLinks.GitHubUrl },
                { kind: InfoLinkKind.Web, url: web }
            ]
        };
    }

    /**
     * @returns The environment variables that are unset or invalid, so that startup can say which links `/info` will show disabled.
     */
    static missingVariables(): string[] {
        return [
            ...(InfoLinks.validUrl(process.env.SUPPORT_INVITE_URL) ? [] : ['SUPPORT_INVITE_URL']),
            ...(InfoLinks.webUrl() ? [] : ['WEB_URL'])
        ];
    }

    /**
     * @param applicationId The application to invite.
     * @returns Discord's authorization URL adding the bot with slash commands and the Administrator permission, which a moderation bot needs to ban, manage roles and read the audit log.
     */
    private static inviteUrl(applicationId: string): string {
        const query = new URLSearchParams({
            client_id: applicationId,
            scope: 'bot applications.commands',
            permissions: PermissionFlagsBits.Administrator.toString()
        });

        return `https://discord.com/oauth2/authorize?${query}`;
    }

    /**
     * The web's address is `WEB_URL`, the same variable the bot reaches the web with, so there is one
     * address to keep right for both.
     * @returns `WEB_URL` without a trailing slash, or `undefined` if it is unset or not an http(s) URL.
     */
    private static webUrl(): string | undefined {
        return InfoLinks.validUrl(process.env.WEB_URL)?.replace(/\/+$/, '');
    }

    /**
     * @param value A URL from the environment.
     * @returns The value if it is an http or https URL, otherwise `undefined`.
     */
    private static validUrl(value: string | undefined): string | undefined {
        if (!value) return undefined;

        try {
            const { protocol } = new URL(value);

            return protocol === 'https:' || protocol === 'http:' ? value : undefined;
        } catch {
            return undefined;
        }
    }
}

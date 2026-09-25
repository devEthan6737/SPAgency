import type { UsingClient } from 'seyfert';
import { AppEmojiName } from './AppEmojiName.js';
import { EmojiCatalog } from './EmojiCatalog.js';
import type { EmojiKey } from './EmojiKey.js';

/** The part of Discord's application emoji object this class reads. */
interface DiscordApplicationEmoji {
    id: string;
    name: string;
    animated?: boolean;
}

/**
 * The application emojis of the running bot, by name. The ids differ between the production, canary
 * and developing applications, so nothing stores one: {@link Emojis.load} reads them once at startup,
 * into memory only, and {@link Emojis.get} turns an {@link EmojiKey} into what a message should contain.
 */
export class Emojis {
    /** Discord's markup for each uploaded emoji this application has, e.g. `<:sp_fbm_yes:123>`. */
    private static readonly markup = new Map<string, string>();

    /**
     * Startup entry point: loads the emojis and reports through the logger, never throwing, since
     * the unicode fallback keeps the bot fully usable. It must run before `client.start()`: the
     * locales are imported there and read {@link Emojis.get} while they load.
     * @param client The client, only for its logger.
     * @returns Resolves once the emojis are loaded, or once loading has failed and been logged.
     */
    static async setup(client: UsingClient): Promise<void> {
        try {
            await Emojis.load(process.env.BOT_TOKEN ?? '');
        } catch (error) {
            client.logger.warn('[emojis] Could not read the application emojis, using the unicode ones', error);
            return;
        }

        const missing = Emojis.missing();
        if (missing.length) client.logger.warn(`[emojis] This application lacks ${missing.length} emojis: ${missing.join(', ')}`);
    }

    /**
     * Reads the application's emojis from Discord.
     * @param token The bot token; its first segment is the application id.
     * @returns Resolves once the emojis are in memory.
     * @throws {Error} If Discord answers with an error status or can't be reached in 10 seconds.
     */
    static async load(token: string): Promise<void> {
        const applicationId = Buffer.from(token.split('.')[0] ?? '', 'base64').toString();
        const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}/emojis`, {
            headers: { Authorization: `Bot ${token}` },
            signal: AbortSignal.timeout(10_000)
        });
        if (!response.ok) throw new Error(`Discord answered ${response.status} listing the application emojis`);

        const { items } = (await response.json()) as { items: DiscordApplicationEmoji[] };
        Emojis.markup.clear();
        for (const emoji of items) Emojis.markup.set(emoji.name, `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`);
    }

    /**
     * @param key What the message means.
     * @returns The application's emoji for that key, or its unicode fallback if it wasn't uploaded
     * (or {@link Emojis.load} failed).
     */
    static get(key: EmojiKey): string {
        const { name, fallback } = EmojiCatalog[key];

        return Emojis.markup.get(name) ?? fallback;
    }

    /**
     * @returns The registered {@link AppEmojiName}s this application doesn't have, to warn at startup
     * which uploads are missing.
     */
    static missing(): AppEmojiName[] {
        return Object.values(AppEmojiName).filter((name) => !Emojis.markup.has(name));
    }
}

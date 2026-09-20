import type { MessageStructure, UsingClient } from 'seyfert';
import type { SupportSettings } from './SupportConfig.js';
import { SupportMessages, type SupportMessage } from './SupportMessages.js';

/** Reads a ticket channel back from Discord, through {@link SupportMessages.normalize}. Discord returns pages newest-first; everything here hands them back oldest-first. */
export class SupportHistory {
    /**
     * Up to `count` web-visible messages after a cursor, oldest first. Pages through the channel
     * until it has enough or runs out — messages the normalizer drops don't count towards `count`.
     * @param client Bot client.
     * @param settings Support settings.
     * @param channelId The ticket's channel.
     * @param after Message id to start after — `'0'` for the beginning.
     * @param count How many messages to return at most.
     */
    static async after(client: UsingClient, settings: SupportSettings, channelId: string, after: string, count: number): Promise<SupportMessage[]> {
        const found: SupportMessage[] = [];
        let cursor = after;

        while (found.length < count) {
            const page = SupportHistory.oldestFirst(await client.channels.fetchMessages(channelId, { after: cursor, limit: 100 }));
            if (!page.length) break;

            for (const message of page) {
                const normalized = await SupportMessages.normalize(client, settings, message);
                if (normalized && normalized.author !== 'note') found.push(normalized);
            }

            cursor = page[page.length - 1].id;
            if (page.length < 100) break;
        }

        return found.slice(0, count);
    }

    /**
     * The most recent web-visible messages, oldest first, together with how far back that reaches.
     * @param client Bot client.
     * @param settings Support settings.
     * @param channelId The ticket's channel.
     * @param count How many raw messages to read, at most (Discord serves 100 per request).
     * @returns The messages, and `floor`: the buffer is complete for every message *after* that id.
     * `'0'` means the whole channel was read, so it is complete from the beginning.
     */
    static async recent(client: UsingClient, settings: SupportSettings, channelId: string, count: number): Promise<{ messages: SupportMessage[]; floor: string }> {
        const raw: MessageStructure[] = [];
        let exhausted = false;

        while (raw.length < count) {
            const size = Math.min(100, count - raw.length);
            const before = raw.length ? SupportHistory.oldestFirst(raw)[0].id : undefined;
            const page = await client.channels.fetchMessages(channelId, { limit: size, ...(before && { before }) });

            raw.push(...page);
            if (page.length < size) {
                exhausted = true;
                break;
            }
        }

        const floor = exhausted ? '0' : SupportHistory.oldestFirst(raw)[0].id;
        return await SupportHistory.normalizeAll(client, settings, raw, floor);
    }

    /** Normalizes raw messages oldest-first, dropping what the web never sees. */
    private static async normalizeAll(client: UsingClient, settings: SupportSettings, raw: MessageStructure[], floor: string) {
        const messages: SupportMessage[] = [];

        for (const message of SupportHistory.oldestFirst(raw)) {
            const normalized = await SupportMessages.normalize(client, settings, message);
            if (normalized && normalized.author !== 'note') messages.push(normalized);
        }

        return { messages, floor };
    }

    /** A copy of `messages` ordered oldest to newest. */
    private static oldestFirst(messages: MessageStructure[]): MessageStructure[] {
        return [...messages].sort((a, b) => SupportMessages.compareIds(a.id, b.id));
    }
}

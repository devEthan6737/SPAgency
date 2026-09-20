import type { MessageStructure, UsingClient } from 'seyfert';
import type { SupportSettings } from './SupportConfig.js';
import { SupportMessages, type SupportMessage } from './SupportMessages.js';

/** What {@link SupportHistory.after} reads. */
export interface HistoryAfterQuery {
    /** The ticket's channel. */
    channelId: string;
    /** Message id to start after — `'0'` for the beginning of the channel. */
    after: string;
    /** How many web-visible messages to return at most. */
    count: number;
}

/** What {@link SupportHistory.recent} reads. */
export interface HistoryRecentQuery {
    /** The ticket's channel. */
    channelId: string;
    /** How many raw messages to read, at most (Discord serves 100 per request). */
    count: number;
}

/** Reads a ticket channel back from Discord, through {@link SupportMessages.normalize}. Discord returns pages newest-first; everything here hands them back oldest-first. */
export class SupportHistory {
    /**
     * Up to `count` web-visible messages after a cursor, oldest first. Pages through the channel
     * until it has enough or runs out — messages the normalizer drops don't count towards `count`.
     * @param client Bot client.
     * @param settings Support settings.
     * @param query The channel, the cursor and how many messages to return.
     * @returns The messages, oldest first, without internal notes.
     */
    static async after(client: UsingClient, settings: SupportSettings, { channelId, after, count }: HistoryAfterQuery): Promise<SupportMessage[]> {
        const found: SupportMessage[] = [];
        let cursor = after;

        while (found.length < count) {
            const page = SupportHistory.oldestFirst(await client.channels.fetchMessages(channelId, { after: cursor, limit: 100 }));
            if (!page.length) break;

            found.push(...(await SupportHistory.visible(client, settings, page)));

            cursor = page[page.length - 1].id;
            if (page.length < 100) break;
        }

        return found.slice(0, count);
    }

    /**
     * The whole channel, oldest first — for building a transcript. Unlike {@link SupportHistory.after}
     * it keeps the staff's internal notes, and it also returns the raw messages, because the notice
     * that records who closed the ticket is one the normalizer drops.
     * @param client Bot client.
     * @param settings Support settings.
     * @param channelId The ticket's channel.
     * @returns Every normalized message, notes included, and every raw message.
     */
    static async full(client: UsingClient, settings: SupportSettings, channelId: string): Promise<{ messages: SupportMessage[]; raw: MessageStructure[] }> {
        const raw: MessageStructure[] = [];
        let cursor = '0';

        while (true) {
            const page = SupportHistory.oldestFirst(await client.channels.fetchMessages(channelId, { after: cursor, limit: 100 }));
            raw.push(...page);
            if (page.length < 100) break;

            cursor = page[page.length - 1].id;
        }

        const messages: SupportMessage[] = [];
        for (const message of raw) {
            const normalized = await SupportMessages.normalize(client, settings, message);
            if (normalized) messages.push(normalized);
        }

        return { messages, raw };
    }

    /**
     * The most recent web-visible messages, oldest first, together with how far back that reaches.
     * @param client Bot client.
     * @param settings Support settings.
     * @param query The channel and how many raw messages to read.
     * @returns The messages, and `floor`: the result is complete for every message *after* that id.
     * `'0'` means the whole channel was read, so it is complete from the beginning.
     */
    static async recent(client: UsingClient, settings: SupportSettings, { channelId, count }: HistoryRecentQuery): Promise<{ messages: SupportMessage[]; floor: string }> {
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
        return { messages: await SupportHistory.visible(client, settings, raw), floor };
    }

    /**
     * Normalizes raw messages oldest-first, dropping what the web never sees.
     * @param client Bot client.
     * @param settings Support settings.
     * @param raw Raw messages in any order.
     * @returns The `staff` and `user` messages, oldest first — no internal notes.
     */
    private static async visible(client: UsingClient, settings: SupportSettings, raw: MessageStructure[]): Promise<SupportMessage[]> {
        const messages: SupportMessage[] = [];

        for (const message of SupportHistory.oldestFirst(raw)) {
            const normalized = await SupportMessages.normalize(client, settings, message);
            if (normalized && normalized.author !== 'note') messages.push(normalized);
        }

        return messages;
    }

    /**
     * Orders messages by age.
     * @param messages Raw messages in any order.
     * @returns A copy ordered oldest to newest.
     */
    private static oldestFirst(messages: MessageStructure[]): MessageStructure[] {
        return [...messages].sort((a, b) => SupportMessages.compareIds(a.id, b.id));
    }
}

import type { UsingClient } from 'seyfert';
import type { SupportSettings } from './SupportConfig.js';
import { SupportHistory } from './SupportHistory.js';
import { SupportMessages, type SupportMessage } from './SupportMessages.js';
import type { SupportTicket } from './SupportTicket.js';

/** A ticket's recent messages, ascending. Every web-visible message with an id greater than `floor` is in `messages`. */
interface BufferEntry {
    messages: SupportMessage[];
    floor: string;
}

/**
 * Per-ticket buffer of the latest web-visible messages, so the web's polling — every ~3 s per open
 * ticket — is answered from memory instead of Discord. Filled lazily on the first read of a ticket
 * (after a restart too), then kept current by live messages; a read that reaches further back than
 * the buffer falls through to the channel's history.
 */
export class SupportMessageBuffer {
    private static entries = new Map<string, BufferEntry>();

    /** Loads in flight, so two simultaneous first reads of a ticket share one. */
    private static loading = new Map<string, Promise<BufferEntry>>();

    /** Live messages that arrived while a load was in flight — the load's REST read may or may not include them. */
    private static arrivals = new Map<string, SupportMessage[]>();

    /**
     * Messages after a cursor, oldest first.
     * @param client Bot client.
     * @param settings Support settings.
     * @param ticket The ticket to read.
     * @param after Message id to start after; without one, from the beginning of the ticket.
     * @param limit Most messages to return.
     */
    static async read(client: UsingClient, settings: SupportSettings, ticket: SupportTicket, after: string | undefined, limit: number): Promise<SupportMessage[]> {
        const entry = SupportMessageBuffer.entries.get(ticket.channelId) ?? (await SupportMessageBuffer.load(client, settings, ticket.channelId));
        const cursor = after ?? '0';

        if (SupportMessages.compareIds(cursor, entry.floor) >= 0) {
            return entry.messages.filter((message) => SupportMessages.compareIds(message.id, cursor) > 0).slice(0, limit);
        }

        return await SupportHistory.after(client, settings, ticket.channelId, cursor, limit);
    }

    /**
     * Records a live message. A ticket nobody has read yet has no buffer to update — its first read
     * will find the message in the channel anyway.
     */
    static push(channelId: string, message: SupportMessage): void {
        const entry = SupportMessageBuffer.entries.get(channelId);
        if (entry) return SupportMessageBuffer.add(entry, message);

        SupportMessageBuffer.arrivals.get(channelId)?.push(message);
    }

    /** Forgets a ticket's buffer — once it's closed or its channel is gone. */
    static drop(channelId: string): void {
        SupportMessageBuffer.entries.delete(channelId);
    }

    /** Reads the latest messages of a channel into a new buffer, sharing the read with any concurrent caller. */
    private static load(client: UsingClient, settings: SupportSettings, channelId: string): Promise<BufferEntry> {
        let loading = SupportMessageBuffer.loading.get(channelId);
        if (loading) return loading;

        SupportMessageBuffer.arrivals.set(channelId, []);
        loading = SupportHistory.recent(client, settings, channelId, 200)
            .then(({ messages, floor }) => {
                const entry: BufferEntry = { messages, floor };
                for (const message of SupportMessageBuffer.arrivals.get(channelId) ?? []) SupportMessageBuffer.add(entry, message);

                SupportMessageBuffer.entries.set(channelId, entry);
                return entry;
            })
            .finally(() => {
                SupportMessageBuffer.arrivals.delete(channelId);
                SupportMessageBuffer.loading.delete(channelId);
            });

        SupportMessageBuffer.loading.set(channelId, loading);
        return loading;
    }

    /** Adds a message in order, ignoring one already there, and trims the buffer to its capacity — moving `floor` up to the newest message dropped. */
    private static add(entry: BufferEntry, message: SupportMessage): void {
        if (entry.messages.some((existing) => existing.id === message.id)) return;

        entry.messages.push(message);
        entry.messages.sort((a, b) => SupportMessages.compareIds(a.id, b.id));

        if (entry.messages.length > 200) {
            const dropped = entry.messages.splice(0, entry.messages.length - 200);
            entry.floor = dropped[dropped.length - 1].id;
        }
    }
}

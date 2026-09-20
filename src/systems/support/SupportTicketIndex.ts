import type { UsingClient } from 'seyfert';
import type { SupportSettings } from './SupportConfig.js';
import { SupportTicketChannel, type SupportTicket } from './SupportTicket.js';

/**
 * In-memory index of the open tickets, so the hot paths (every message in the support guild, every
 * poll from the web) never touch the network. Rebuilt from the category's channel topics on every
 * fresh gateway session and kept up to date by the create/close flows and `channelDelete`.
 */
export class SupportTicketIndex {
    private static tickets = new Map<string, SupportTicket>();
    private static channels = new Map<string, string>();
    private static built = false;

    /** Whether the first {@link SupportTicketIndex.rebuild} has finished — until then the API answers `503`. */
    static isReady(): boolean {
        return SupportTicketIndex.built;
    }

    /** Number of tickets currently indexed. */
    static get size(): number {
        return SupportTicketIndex.tickets.size;
    }

    /**
     * Rebuilds the index from the support category. Asks Discord (`force`) rather than the cache: `ready`
     * fires before the guilds' channels arrive, so the cache can still be empty at this point.
     * @param client Bot client.
     * @param settings Support settings — the guild and category to scan.
     */
    static async rebuild(client: UsingClient, { guildId, categoryId }: SupportSettings): Promise<void> {
        const startedAt = Date.now();
        const channels = await client.guilds.channels.list(guildId, true);

        const fresh = new Map<string, SupportTicket>();
        for (const channel of channels) {
            if (!channel.isTextGuild() || channel.parentId !== categoryId) continue;

            const ticket = SupportTicketChannel.parse(channel);
            if (ticket) fresh.set(ticket.ticketId, ticket);
        }

        // A ticket created while the list request was in flight isn't in it yet — dropping it would let its owner open a second one.
        for (const ticket of SupportTicketIndex.tickets.values()) {
            if (!fresh.has(ticket.ticketId) && SupportTicketChannel.createdAt(ticket.channelId).getTime() >= startedAt - 10_000) fresh.set(ticket.ticketId, ticket);
        }

        SupportTicketIndex.tickets = fresh;
        SupportTicketIndex.channels = new Map([...fresh.values()].map((ticket) => [ticket.channelId, ticket.ticketId]));
        SupportTicketIndex.built = true;
    }

    /** Indexes a ticket — used right after its channel is created. */
    static add(ticket: SupportTicket): void {
        SupportTicketIndex.tickets.set(ticket.ticketId, ticket);
        SupportTicketIndex.channels.set(ticket.channelId, ticket.ticketId);
    }

    /** Drops the ticket living in `channelId`, if any — from a finished close or a channel deleted by hand. */
    static remove(channelId: string): void {
        const ticketId = SupportTicketIndex.channels.get(channelId);
        if (ticketId) SupportTicketIndex.tickets.delete(ticketId);
        SupportTicketIndex.channels.delete(channelId);
    }

    /** The ticket with this id, or `undefined`. */
    static get(ticketId: string): SupportTicket | undefined {
        return SupportTicketIndex.tickets.get(ticketId);
    }

    /** The ticket living in this channel, or `undefined` — `undefined` for every channel that isn't a ticket. */
    static getByChannel(channelId: string): SupportTicket | undefined {
        const ticketId = SupportTicketIndex.channels.get(channelId);
        return ticketId ? SupportTicketIndex.tickets.get(ticketId) : undefined;
    }

    /** Every ticket of a user, closing ones included — at most one today, but a list so the limit can change. */
    static ofUser(userId: string): SupportTicket[] {
        return [...SupportTicketIndex.tickets.values()].filter((ticket) => ticket.userId === userId);
    }
}

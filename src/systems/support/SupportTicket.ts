/** `closing` from the moment closing starts until the web confirms the transcript — see docs/support.md. */
export type SupportTicketState = 'open' | 'closing';

/** Who closed a ticket. Goes to the web with the transcript. */
export type SupportClosedBy = 'user' | 'staff';

/** A ticket as the bot knows it — rebuilt from its channel's name and topic, never stored anywhere else. */
export interface SupportTicket {
    /** Opaque, random id the web knows the ticket by. */
    ticketId: string;
    /** Discord id of the user who opened it. */
    userId: string;
    /** Subject, as a single line. */
    subject: string;
    /** The channel the ticket lives in. */
    channelId: string;
    state: SupportTicketState;
}

/** The channel fields {@link SupportTicketChannel.parse} reads — a subset every guild text channel structure satisfies. */
export interface SupportChannelData {
    id: string;
    name: string;
    /** `null` or absent for a channel without a topic. */
    topic?: string | null;
}

/**
 * The ticket ⇄ channel encoding. The channel *is* the ticket's storage: the topic carries the
 * identifiers and the subject (written once, at creation — Discord limits topic and name edits to 2
 * per 10 minutes), the name carries the state, and the opening date is the channel id's snowflake.
 */
export class SupportTicketChannel {
    /**
     * Channel name of an open ticket.
     * @param ticketId The ticket's id.
     * @returns `ticket-` plus the first 6 characters of the id (Discord lowercases it).
     */
    static openName(ticketId: string): string {
        return `ticket-${ticketId.slice(0, 6)}`;
    }

    /**
     * Channel name once closing has started — the marker that lets a restarted bot resume the close.
     * @param ticketId The ticket's id.
     * @returns `cerrando-` plus the first 6 characters of the id.
     */
    static closingName(ticketId: string): string {
        return `cerrando-${ticketId.slice(0, 6)}`;
    }

    /**
     * Machine-readable topic: identifiers on the first line, the subject on the second.
     * @param ticketId The ticket's id.
     * @param userId Discord id of the ticket's owner.
     * @param subject The subject, which must already be a single line.
     * @returns The two-line topic {@link SupportTicketChannel.parse} reads back.
     */
    static topic(ticketId: string, userId: string, subject: string): string {
        return `ticket:${ticketId} user:${userId}\n${subject}`;
    }

    /**
     * Reads a ticket back out of a channel.
     * @param channel The channel's id, name and topic.
     * @returns The ticket, or `null` if the topic doesn't match the format — such a channel just isn't a ticket.
     */
    static parse({ id, name, topic }: SupportChannelData): SupportTicket | null {
        const [header, subject = ''] = (topic ?? '').split('\n');
        const match = /^ticket:([A-Za-z0-9_-]{22}) user:(\d{15,25})$/.exec(header);
        if (!match) return null;

        return {
            ticketId: match[1],
            userId: match[2],
            subject: subject.trim(),
            channelId: id,
            state: name.startsWith('cerrando-') ? 'closing' : 'open'
        };
    }

    /**
     * Opening date of a ticket, or any other timestamp a snowflake carries.
     * @param snowflakeId A Discord id — the ticket's channel for its opening date.
     * @returns The date the id was created.
     */
    static createdAt(snowflakeId: string): Date {
        // A snowflake keeps its creation time, in ms since the Discord epoch, above the lowest 22 bits.
        return new Date(Number((BigInt(snowflakeId) >> 22n) + 1_420_070_400_000n));
    }
}

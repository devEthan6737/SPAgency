import { createHmac, timingSafeEqual } from 'node:crypto';

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
    /**
     * Messages the user has sent through the web since the bot started. Not persisted, so a restart
     * resets it — the size cap on the transcript itself is what covers that case.
     */
    userMessages: number;
}

/** What {@link SupportTicketChannel.topic} needs to describe a new ticket. */
export interface SupportTicketIdentity {
    /** The ticket's id. */
    ticketId: string;
    /** Discord id of the ticket's owner. */
    userId: string;
    /** The subject, which must already be a single line. */
    subject: string;
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
 *
 * **The topic is signed.** Nothing else vouches for a channel being a real ticket — there's no
 * database row to check against — so without a signature, anyone able to create a channel in the
 * support category (`ManageChannels` there) could hand-write a topic in the right shape and have the
 * bot treat it as a genuine ticket of any `userId`, transcript pushed to the web and all. The HMAC
 * over `ticketId:userId`, keyed by `VERIFICATION_SECRET` (bot-only, never shared with the web),
 * closes that: forging a topic now also requires the secret. That secret already signs the
 * verification tokens, so the signed text carries a `support-topic:` label — a signature from one use
 * can never be valid for the other. Rotating it orphans every open ticket: their topics stop verifying.
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
     * Machine-readable topic: identifiers and signature on the first line, the subject on the second.
     * @param identity The ticket's id, owner and subject.
     * @param secret `VERIFICATION_SECRET`, which signs the identifiers.
     * @returns The two-line topic {@link SupportTicketChannel.parse} reads back.
     */
    static topic({ ticketId, userId, subject }: SupportTicketIdentity, secret: string): string {
        return `ticket:${ticketId} user:${userId} sig:${SupportTicketChannel.sign(ticketId, userId, secret)}\n${subject}`;
    }

    /**
     * Reads a ticket back out of a channel, verifying its signature.
     * @param channel The channel's id, name and topic.
     * @param secret `VERIFICATION_SECRET`, checked against the topic's `sig`.
     * @returns The ticket, or `null` if the topic doesn't match the format or its signature doesn't
     * check out — such a channel isn't a genuine ticket, whatever it looks like.
     */
    static parse({ id, name, topic }: SupportChannelData, secret: string): SupportTicket | null {
        const [header, subject = ''] = (topic ?? '').split('\n');
        const match = /^ticket:([A-Za-z0-9_-]{22}) user:(\d{15,25}) sig:([A-Za-z0-9_-]+)$/.exec(header);
        if (!match) return null;

        const [, ticketId, userId, signature] = match;
        if (!SupportTicketChannel.verify({ ticketId, userId, signature }, secret)) return null;

        return {
            ticketId,
            userId,
            subject: subject.trim(),
            channelId: id,
            state: name.startsWith('cerrando-') ? 'closing' : 'open',
            userMessages: 0
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

    /**
     * Signs a `(ticketId, userId)` pair.
     * @param ticketId The ticket's id.
     * @param userId Discord id of the ticket's owner.
     * @param secret `VERIFICATION_SECRET`.
     * @returns The signature, as it goes in the topic.
     */
    private static sign(ticketId: string, userId: string, secret: string): string {
        // The label keeps this apart from the verification tokens signed with the same secret.
        return createHmac('sha256', secret).update(`support-topic:${ticketId}:${userId}`).digest('base64url');
    }

    /**
     * Checks a topic's signature in constant time.
     * @param claim The `ticketId`, `userId` and `signature` as read from the topic.
     * @param secret `VERIFICATION_SECRET`.
     * @returns Whether `signature` is what {@link SupportTicketChannel.sign} would produce for this pair.
     */
    private static verify({ ticketId, userId, signature }: { ticketId: string; userId: string; signature: string }, secret: string): boolean {
        const expected = Buffer.from(SupportTicketChannel.sign(ticketId, userId, secret));
        const given = Buffer.from(signature);

        return given.length === expected.length && timingSafeEqual(given, expected);
    }
}

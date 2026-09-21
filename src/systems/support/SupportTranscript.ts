import type { UsingClient } from 'seyfert';
import type { SupportMessage } from './SupportMessages.js';
import type { SupportClosedBy, SupportTicket } from './SupportTicket.js';

/** What a transcript is built from, besides the messages. */
export interface TranscriptInfo {
    /** The ticket the transcript is of. */
    ticket: SupportTicket;
    /** When it was opened, ISO 8601. */
    openedAt: string;
    /** When it was closed, ISO 8601. */
    closedAt: string;
    /** Who closed it. */
    closedBy: SupportClosedBy;
}

/** Body of `POST <WEB_URL>/api/support/transcripts` — the contract with the web. */
export interface TranscriptPayload {
    ticketId: string;
    userId: string;
    subject: string;
    /** ISO 8601. */
    openedAt: string;
    /** ISO 8601. */
    closedAt: string;
    closedBy: SupportClosedBy;
    /** Only `staff` and `user` messages, oldest first. */
    messages: SupportMessage[];
}

/** The user's version of a transcript, and how many of the oldest messages had to be left out to fit what the web accepts. */
export interface WebTranscript {
    /** The body to send to the web. */
    payload: TranscriptPayload;
    /** Messages dropped from the start of the conversation — `0` when everything fit. */
    omitted: number;
}

/** Builds the two versions of a closed ticket's transcript. */
export class SupportTranscript {
    /**
     * The user's version, which the web stores forever: only what the web itself showed —
     * `staff` and `user` messages, no internal notes.
     * @param info The ticket and when and by whom it was closed.
     * @param messages Every normalized message of the ticket, notes included; the notes are dropped here.
     * @returns The body to send to the web. The web refuses more than 5000 messages or 5 MB, and a transcript it
     * refuses is one the ticket can never be closed with, so an oversized conversation keeps only its newest
     * messages, and `omitted` says how many went — the staff's copy still has them all.
     */
    static forWeb({ ticket, openedAt, closedAt, closedBy }: TranscriptInfo, messages: SupportMessage[]): WebTranscript {
        const visible = messages.filter((message) => message.author !== 'note');

        // Below the web's limits, with room for the rest of the body.
        let bytes = 0;
        let start = visible.length;
        while (start > 0 && visible.length - start < 4_500) {
            const size = Buffer.byteLength(JSON.stringify(visible[start - 1])) + 1;
            if (bytes + size > 4_000_000) break;

            bytes += size;
            start--;
        }

        return {
            payload: { ticketId: ticket.ticketId, userId: ticket.userId, subject: ticket.subject, openedAt, closedAt, closedBy, messages: visible.slice(start) },
            omitted: start
        };
    }

    /**
     * The staff's version, as the text of a file: everything above plus the internal notes, which
     * is why it never goes to the web. Continuation lines are indented under their message.
     * @param client Bot client, for the localized labels.
     * @param info The ticket and when and by whom it was closed.
     * @param messages Every normalized message of the ticket, notes included.
     * @returns The file's text: a header, a rule, then one entry per message — the newest ones only, with a line saying so, if the file would be too big to upload.
     */
    static forStaff(client: UsingClient, { ticket, openedAt, closedAt, closedBy }: TranscriptInfo, messages: SupportMessage[]): string {
        const t = client.t('es').systems.support.transcript;
        const by = closedBy === 'user' ? t.closedByUser.get() : t.closedByStaff.get();

        const entries = messages.map((message) => {
            const [first, ...rest] = message.content.split('\n');
            const label = t.authors[message.author].get();

            return [`[${SupportTranscript.timestamp(message.at)}] ${message.name} (${label}): ${first}`, ...rest.map((line) => `    ${line}`)].join('\n');
        });

        // Discord refuses attachments over about 10 MB; keep the newest entries under 8.
        let bytes = 0;
        let start = entries.length;
        while (start > 0) {
            const size = Buffer.byteLength(entries[start - 1]) + 1;
            if (bytes + size > 8_000_000) break;

            bytes += size;
            start--;
        }

        const omitted = start > 0 ? `${t.staffTruncated(start).get()}\n` : '';
        const header = t.header(ticket.subject, ticket.ticketId, ticket.userId, SupportTranscript.timestamp(openedAt), SupportTranscript.timestamp(closedAt), by).get();
        return `${header}\n${'-'.repeat(60)}\n${omitted}${entries.slice(start).join('\n')}\n`;
    }

    /**
     * Formats an ISO date for the staff's file.
     * @param iso An ISO 8601 date, e.g. `2026-09-20T10:30:00.000Z`.
     * @returns The same instant as `2026-09-20 10:30:00 UTC`.
     */
    private static timestamp(iso: string): string {
        return `${iso.slice(0, 19).replace('T', ' ')} UTC`;
    }
}

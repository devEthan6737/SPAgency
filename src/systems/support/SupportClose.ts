import { setTimeout as sleep } from 'node:timers/promises';
import { AttachmentBuilder, OverwriteType, type UsingClient } from 'seyfert';
import type { SupportSettings } from './SupportConfig.js';
import { SupportHistory } from './SupportHistory.js';
import { SupportMessageBuffer } from './SupportMessageBuffer.js';
import { SupportPosts } from './SupportPosts.js';
import { SupportTicketChannel, type SupportClosedBy, type SupportTicket } from './SupportTicket.js';
import { SupportTicketIndex } from './SupportTicketIndex.js';
import { SupportTranscript, type TranscriptInfo, type TranscriptPayload } from './SupportTranscript.js';
import { SupportWebClient, type PushResult } from './SupportWebClient.js';

/** `already` means a close is under way, which for whoever asked is as good as `started`. */
export type BeginCloseResult = 'started' | 'already' | 'failed';

/** What {@link SupportClose.begin} needs to start a close. */
export interface BeginCloseInput {
    /** The ticket to close. */
    ticket: SupportTicket;
    /** Who asked for it. */
    closedBy: SupportClosedBy;
    /** The staff member, when `closedBy` is `staff` — named in the notice. */
    staffId?: string;
}

/** One run of the slow half of a close. */
interface CloseJob {
    ticket: SupportTicket;
    /** Who closed it, if known — otherwise it's read back from the channel's close notice. */
    closedBy?: SupportClosedBy;
    /** How many times an unexpected failure has already restarted this job. */
    attempt?: number;
}

/** A message for the staff channel carrying a transcript copy. */
interface StaffPost {
    /** The message text. */
    content: string;
    /** The ticket the copy is of — names the attached file. */
    ticket: SupportTicket;
    /** The staff transcript, attached as a text file. */
    transcript: string;
}

/**
 * Closing a ticket, whoever asks for it — see docs/support.md. `begin` is quick and does what must
 * happen before answering (mark, lock, notice); `finish` does the slow part in the background: build
 * the transcript, get the web to keep it, and only then archive, notify and delete the channel.
 * The channel is never deleted before the web confirmed the transcript.
 */
export class SupportClose {
    /** Tickets with a `finish` running — resuming after a restart must not start a second one. */
    private static active = new Set<string>();

    /**
     * Starts closing a ticket: marks it closing, renames and locks its channel, posts the notice, and
     * launches {@link SupportClose.finish} in the background.
     * @param client Bot client.
     * @param settings Support settings.
     * @param input The ticket, who closes it and, for the staff, which member.
     * @returns `started`, `already` if a close is under way, or `failed` if the channel couldn't be
     * renamed — without that marker a restart couldn't resume the close, so nothing is started.
     */
    static async begin(client: UsingClient, settings: SupportSettings, { ticket, closedBy, staffId }: BeginCloseInput): Promise<BeginCloseResult> {
        if (ticket.state === 'closing') return 'already';
        // Before the first await: from here on nobody else can start a close or write into the ticket.
        ticket.state = 'closing';

        try {
            await client.guilds.channels.edit(settings.guildId, ticket.channelId, { name: SupportTicketChannel.closingName(ticket.ticketId) });
        } catch (error) {
            client.logger.error('[support] Marking the ticket channel as closing failed', error);
            ticket.state = 'open';
            return 'failed';
        }

        // The staff keep seeing the channel but can't write in it. The bot's own overwrite still lets it.
        await client.channels
            .editOverwrite(ticket.channelId, settings.staffRoleId, { type: OverwriteType.Role, allow: ['ViewChannel', 'ReadMessageHistory', 'AttachFiles'], deny: ['SendMessages'] })
            .catch((error: unknown) => client.logger.warn('[support] Locking the ticket channel failed', error));
        await client.messages
            .write(ticket.channelId, SupportPosts.closeNotice(client, closedBy, staffId))
            .catch((error: unknown) => client.logger.warn('[support] Posting the close notice failed', error));

        SupportClose.launch(client, settings, { ticket, closedBy });
        return 'started';
    }

    /**
     * Resumes every ticket found closing — called after the index is rebuilt, since a close that
     * was under way when the bot went down leaves nothing but its `cerrando-` channel behind.
     * @param client Bot client.
     * @param settings Support settings.
     */
    static resumeAll(client: UsingClient, settings: SupportSettings): void {
        for (const ticket of SupportTicketIndex.all()) {
            if (ticket.state === 'closing') SupportClose.launch(client, settings, { ticket });
        }
    }

    /**
     * Runs {@link SupportClose.finish} in the background, at most once per ticket. An unexpected
     * failure (Discord erroring while the history is read, say) is retried a few times a minute apart;
     * after that the ticket stays closing until the next restart resumes it.
     * @param client Bot client.
     * @param settings Support settings.
     * @param job The ticket to finish closing and what is already known about the close.
     */
    private static launch(client: UsingClient, settings: SupportSettings, job: CloseJob): void {
        const { ticket, attempt = 0 } = job;
        if (attempt === 0 && SupportClose.active.has(ticket.ticketId)) return;
        SupportClose.active.add(ticket.ticketId);

        void SupportClose.finish(client, settings, job)
            .then(() => SupportClose.active.delete(ticket.ticketId))
            .catch(async (error: unknown) => {
                client.logger.error('[support] Closing a ticket failed', error);
                if (attempt >= 3) return SupportClose.active.delete(ticket.ticketId);

                await sleep(60_000);
                SupportClose.launch(client, settings, { ...job, attempt: attempt + 1 });
            });
    }

    /**
     * The slow half of a close. If the web refuses the transcript, or stays unreachable through every
     * retry, the channel stays locked and undeleted, the staff get their copy plus an alert, and the
     * next restart tries again — a transcript is never lost.
     * @param client Bot client.
     * @param settings Support settings.
     * @param job The ticket being closed and, if known, who closed it.
     * @throws If Discord fails while the history is read or the channel messages are written; {@link SupportClose.launch} retries.
     */
    private static async finish(client: UsingClient, settings: SupportSettings, { ticket, closedBy }: CloseJob): Promise<void> {
        const { messages, raw } = await SupportHistory.full(client, settings, ticket.channelId);

        const info: TranscriptInfo = {
            ticket,
            openedAt: SupportTicketChannel.createdAt(ticket.channelId).toISOString(),
            closedAt: new Date().toISOString(),
            closedBy: closedBy ?? SupportPosts.closedByOf(client.botId, raw) ?? 'staff'
        };

        const t = client.t('es').systems.support;
        const transcript = SupportTranscript.forStaff(client, info, messages);
        const delivery = await SupportClose.deliver(settings, SupportTranscript.forWeb(info, messages));

        if (!delivery.ok) {
            await SupportClose.postToStaff(client, settings, { content: t.close.deliveryFailed(ticket.subject, ticket.channelId, delivery.reason).get(), ticket, transcript });
            return;
        }

        // From the web's confirmation the ticket is closed as far as the user is concerned — the history page exists now.
        SupportTicketIndex.remove(ticket.channelId);
        SupportMessageBuffer.drop(ticket.channelId);

        const by = info.closedBy === 'user' ? t.transcript.closedByUser.get() : t.transcript.closedByStaff.get();
        const archived = await SupportClose.postToStaff(client, settings, { content: t.close.staffCopy(ticket.subject, ticket.userId, by).get(), ticket, transcript });

        // Best effort: the user doesn't share a server with the bot, so Discord often refuses.
        await client.users
            .fetch(ticket.userId)
            .then((user) => user.write({ content: t.close.dm(ticket.subject).get() }))
            .catch(() => {});

        // Without the staff copy the channel is all that's left of the internal notes — keep it.
        if (!archived) return;

        await client.guilds.channels.delete(settings.guildId, ticket.channelId).catch((error: unknown) => client.logger.error('[support] Deleting a closed ticket channel failed', error));
    }

    /**
     * Pushes the transcript to the web, retrying with a growing wait while the web is merely
     * unavailable — 5 s, 30 s, 5 min, 30 min. A refusal isn't retried.
     * @param settings Support settings — where the web is and the shared key.
     * @param payload The user's version of the transcript.
     * @returns The last attempt's result: `ok` if the web ever confirmed, otherwise why it never did.
     */
    private static async deliver(settings: SupportSettings, payload: TranscriptPayload): Promise<PushResult> {
        let result = await SupportWebClient.pushTranscript(settings, payload);

        for (const delay of [5_000, 30_000, 5 * 60_000, 30 * 60_000]) {
            if (result.ok || !result.retryable) break;

            await sleep(delay);
            result = await SupportWebClient.pushTranscript(settings, payload);
        }

        return result;
    }

    /**
     * Posts a message with the staff's copy of the transcript attached to `STAFF_LOGS_CHANNEL`.
     * Tried three times: failing here is the one case where nobody can be told.
     * @param client Bot client.
     * @param settings Support settings — where the staff channel is.
     * @param post The message text, the ticket it is about and the transcript to attach.
     * @returns Whether it went through.
     */
    private static async postToStaff(client: UsingClient, settings: SupportSettings, { content, ticket, transcript }: StaffPost): Promise<boolean> {
        const file = new AttachmentBuilder().setName(`${SupportTicketChannel.openName(ticket.ticketId)}.txt`).setFile('buffer', Buffer.from(transcript, 'utf8'));

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await client.messages.write(settings.staffChannelId, { content, files: [file], allowed_mentions: { parse: [] } });
                return true;
            } catch (error) {
                client.logger.error(`[support] Posting to the staff channel failed (attempt ${attempt})`, error);
                if (attempt < 3) await sleep(5_000);
            }
        }

        return false;
    }
}

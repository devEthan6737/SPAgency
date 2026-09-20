import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { ChannelType, OverwriteType, PermissionFlagsBits, SeyfertError, type UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import type { MessageStructure } from 'seyfert';
import { SupportConfig, type SupportSettings } from './SupportConfig.js';
import { SupportMessageBuffer } from './SupportMessageBuffer.js';
import { SupportMessages, type SupportMessage } from './SupportMessages.js';
import { SupportPosts } from './SupportPosts.js';
import { SupportTicketChannel, type SupportTicket } from './SupportTicket.js';
import { SupportTicketIndex } from './SupportTicketIndex.js';

/** What the web sends to open a ticket — already validated by {@link SupportApi}. */
export interface CreateTicketInput {
    userId: string;
    username: string;
    avatarUrl: string | null;
    subject: string;
    message: string;
}

/** `tooManyOpen` and `cooldown` are the user's doing; `full` and `failed` are ours (the category is at Discord's limit, or a Discord call failed). */
export type CreateTicketResult = { ok: true; ticket: SupportTicket } | { ok: false; reason: 'tooManyOpen' | 'cooldown' | 'full' | 'failed' };

/** `closing` and `cooldown` are the ticket's or the user's state; `failed` is Discord refusing the write. */
export type SendMessageResult = { ok: true; id: string } | { ok: false; reason: 'closing' | 'cooldown' | 'failed' };

/** Orchestrates a ticket's life on the Discord side — see docs/support.md. */
export class SupportSystem {
    /** Users whose channel is being created right now — makes two quick clicks one ticket, not two. */
    private static creating = new Set<string>();
    private static cooldowns = new ExpiringMap<string, true>();
    private static messageCooldowns = new ExpiringMap<string, true>();

    /**
     * Brings the support system up on a fresh gateway session: warns if the feature isn't fully
     * configured, otherwise (re)builds the ticket index, retrying if Discord fails.
     * @param client Bot client.
     */
    static async start(client: UsingClient): Promise<void> {
        const missing = SupportConfig.missing();
        if (missing.length) return client.logger.warn(`[support] Disabled — missing ${missing.join(', ')}`);

        const settings = SupportConfig.get()!;
        // Delays before each attempt: a failed first build must not leave support down until the next restart.
        for (const delay of [0, 5_000, 30_000]) {
            if (delay) await sleep(delay);

            try {
                await SupportTicketIndex.rebuild(client, settings);
                return client.logger.info(`[support] Ticket index ready (${SupportTicketIndex.size} open)`);
            } catch (error) {
                client.logger.error('[support] Building the ticket index failed', error);
            }
        }
    }

    /** The user's tickets, closing ones included. */
    static listOpen(userId: string): SupportTicket[] {
        return SupportTicketIndex.ofUser(userId);
    }

    /**
     * Opens a ticket: a private channel in the support category, an opening message with the close
     * button, and the user's first message. Checks the limits first — one ticket per user, 60 s between
     * creations — and rolls the channel back if posting into it fails.
     * @param client Bot client.
     * @param settings Support settings.
     * @param input The validated request from the web.
     */
    static async create(client: UsingClient, settings: SupportSettings, input: CreateTicketInput): Promise<CreateTicketResult> {
        const { userId, username, avatarUrl, subject, message } = input;

        if (SupportSystem.creating.has(userId) || SupportTicketIndex.ofUser(userId).length) return { ok: false, reason: 'tooManyOpen' };
        if (SupportSystem.cooldowns.has(userId)) return { ok: false, reason: 'cooldown' };
        // Discord's cap on channels per category.
        if (SupportTicketIndex.size >= 50) return { ok: false, reason: 'full' };

        SupportSystem.creating.add(userId);
        try {
            const ticketId = randomBytes(16).toString('base64url');

            const channel = await client.guilds.channels
                .create(settings.guildId, {
                    type: ChannelType.GuildText,
                    name: SupportTicketChannel.openName(ticketId),
                    topic: SupportTicketChannel.topic(ticketId, userId, subject),
                    parent_id: settings.categoryId,
                    permission_overwrites: SupportSystem.overwrites(client, settings)
                })
                .catch((error: unknown) => {
                    client.logger.error('[support] Creating the ticket channel failed', error);
                    return SupportSystem.isCategoryFull(error) ? 'full' : null;
                });
            if (channel === 'full') return { ok: false, reason: 'full' };
            if (!channel) return { ok: false, reason: 'failed' };

            try {
                await client.messages.write(channel.id, SupportPosts.opening(client, userId, username, subject));
                await client.messages.write(channel.id, SupportPosts.userMessage({ username, avatarUrl }, message));
            } catch (error) {
                client.logger.error('[support] Posting into the new ticket channel failed', error);
                await client.guilds.channels.delete(settings.guildId, channel.id).catch(() => {});
                return { ok: false, reason: 'failed' };
            }

            const ticket: SupportTicket = { ticketId, userId, subject, channelId: channel.id, state: 'open' };
            SupportTicketIndex.add(ticket);
            SupportSystem.cooldowns.set(userId, true, 60_000);

            return { ok: true, ticket };
        } finally {
            SupportSystem.creating.delete(userId);
        }
    }

    /** Whether a channel is one of the open tickets — `messageCreate` uses this to keep them away from automod. */
    static isTicketChannel(channelId: string): boolean {
        return SupportTicketIndex.getByChannel(channelId) !== undefined;
    }

    /**
     * Web-visible messages of a ticket after a cursor, oldest first — from the buffer when it reaches
     * that far back, from the channel's history otherwise.
     * @param client Bot client.
     * @param settings Support settings.
     * @param ticket The ticket to read.
     * @param after Message id to start after; without one, from the beginning.
     * @param limit Most messages to return.
     */
    static messages(client: UsingClient, settings: SupportSettings, ticket: SupportTicket, after: string | undefined, limit: number): Promise<SupportMessage[]> {
        return SupportMessageBuffer.read(client, settings, ticket, after, limit);
    }

    /**
     * Feeds a live message from a ticket channel into the buffer. Errors are logged, never thrown —
     * this runs from the gateway event, where nobody is waiting on it.
     * @param client Bot client.
     * @param message The message that was just created.
     */
    static async ingest(client: UsingClient, message: MessageStructure): Promise<void> {
        const settings = SupportConfig.get();
        if (!settings) return;

        try {
            const normalized = await SupportMessages.normalize(client, settings, message);
            if (normalized && normalized.author !== 'note') SupportMessageBuffer.push(message.channelId, normalized);
        } catch (error) {
            client.logger.error('[support] Reading a ticket message failed', error);
        }
    }

    /**
     * Posts a message the user wrote on the web into their ticket's channel, as an embed carrying
     * their name and avatar. The web only sends the user id, so the name and avatar are looked up
     * (cache first) — if that fails, the message still goes out under a generic name.
     * @param client Bot client.
     * @param ticket The user's ticket.
     * @param content The message text, already length-checked.
     */
    static async sendUserMessage(client: UsingClient, ticket: SupportTicket, content: string): Promise<SendMessageResult> {
        if (ticket.state === 'closing') return { ok: false, reason: 'closing' };
        if (SupportSystem.messageCooldowns.has(ticket.userId)) return { ok: false, reason: 'cooldown' };
        // Set before the writes below, so a burst of requests trips it instead of all slipping past.
        SupportSystem.messageCooldowns.set(ticket.userId, true, 2_000);

        try {
            const user = await client.users.fetch(ticket.userId).catch(() => null);
            const author = { username: user ? (user.globalName ?? user.username) : client.t('es').systems.support.message.unknownUser.get(), avatarUrl: user?.avatarURL() ?? null };

            const sent = await client.messages.write(ticket.channelId, SupportPosts.userMessage(author, content));
            return { ok: true, id: sent.id };
        } catch (error) {
            client.logger.error('[support] Posting a user message failed', error);
            return { ok: false, reason: 'failed' };
        }
    }

    /**
     * Permission overwrites for a ticket channel: hidden from everyone, visible to the staff role and the bot.
     * The user never gets access — their side of the conversation is the web.
     */
    private static overwrites(client: UsingClient, settings: SupportSettings) {
        const chat = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory;

        return [
            { id: settings.guildId, type: OverwriteType.Role, deny: String(PermissionFlagsBits.ViewChannel) },
            { id: settings.staffRoleId, type: OverwriteType.Role, allow: String(chat | PermissionFlagsBits.AttachFiles) },
            // ManageChannels keeps the bot able to rename and delete the channel after a close locks it.
            { id: client.botId, type: OverwriteType.Member, allow: String(chat | PermissionFlagsBits.EmbedLinks | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.ManageChannels) }
        ];
    }

    /** Discord rejects a channel in a category that already holds 50 — recognizable only by the error's text. */
    private static isCategoryFull(error: unknown): boolean {
        return SeyfertError.is(error) && /maximum number of channels/i.test(String(error.metadata?.detail));
    }
}

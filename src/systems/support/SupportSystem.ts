import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { ChannelType, OverwriteType, PermissionFlagsBits, SeyfertError, type MessageStructure, type UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import { RollingWindowCounter } from '../shared/RollingWindowCounter.js';
import { SupportClose } from './SupportClose.js';
import { SupportConfig, type SupportSettings } from './SupportConfig.js';
import { SupportMessageBuffer, type SupportMessageQuery } from './SupportMessageBuffer.js';
import { SupportMessages, type SupportMessage } from './SupportMessages.js';
import { SupportPosts } from './SupportPosts.js';
import { SupportTicketChannel, type SupportTicket } from './SupportTicket.js';
import { SupportTicketIndex } from './SupportTicketIndex.js';

/** What the web sends to open a ticket — already validated by {@link SupportApi}. */
export interface CreateTicketInput {
    /** Discord id of the user opening it. */
    userId: string;
    /** Their display name. */
    username: string;
    /** Their avatar URL, or `null` if the web sent none usable. */
    avatarUrl: string | null;
    /** Subject, as a single line. */
    subject: string;
    /** The first message. */
    message: string;
}

/** `tooManyOpen` and `cooldown` are the user's doing; `full` and `failed` are ours (the category is at Discord's limit, or a Discord call failed). */
export type CreateTicketResult = { ok: true; ticket: SupportTicket } | { ok: false; reason: 'tooManyOpen' | 'cooldown' | 'dailyLimit' | 'full' | 'failed' };

/** `closing`, `full` and `cooldown` are the ticket's or the user's state; `failed` is Discord refusing the write. */
export type SendMessageResult = { ok: true; id: string } | { ok: false; reason: 'closing' | 'full' | 'cooldown' | 'failed' };

/** Orchestrates a ticket's life on the Discord side — see docs/support.md. */
export class SupportSystem {
    /** Users whose channel is being created right now — makes two quick clicks one ticket, not two. */
    private static creating = new Set<string>();

    /** Users who opened a ticket less than a minute ago. */
    private static cooldowns = new ExpiringMap<string, true>();

    /** Tickets each user opened in the last 24 hours — caps the open-and-close loop, which creates and deletes a channel and posts an archive to the staff every time. */
    private static dailyCreations = new RollingWindowCounter(24 * 60 * 60 * 1000);

    /** Users who sent a message less than two seconds ago. */
    private static messageCooldowns = new ExpiringMap<string, true>();

    /**
     * Brings the support system up on a fresh gateway session: warns if the feature isn't fully
     * configured, otherwise (re)builds the ticket index, retrying if Discord fails, and resumes any
     * close that was under way.
     * @param client Bot client.
     */
    static async start(client: UsingClient): Promise<void> {
        const missing = SupportConfig.missing();
        if (missing.length) return client.logger.warn(`[support] Disabled — missing ${missing.join(', ')}`);

        const invalid = SupportConfig.invalid();
        if (invalid.length) return client.logger.warn(`[support] Disabled — ${invalid.join('; ')}`);

        const settings = SupportConfig.get()!;
        // Delays before each attempt: a failed first build must not leave support down until the next restart.
        for (const delay of [0, 5_000, 30_000]) {
            if (delay) await sleep(delay);

            try {
                await SupportTicketIndex.rebuild(client, settings);
            } catch (error) {
                client.logger.error('[support] Building the ticket index failed', error);
                continue;
            }

            client.logger.info(`[support] Ticket index ready (${SupportTicketIndex.size} open)`);
            return SupportClose.resumeAll(client, settings);
        }
    }

    /**
     * Lists a user's tickets.
     * @param userId Discord id of the user.
     * @returns Their tickets, closing ones included.
     */
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
     * @returns The new ticket, or why none was created.
     */
    static async create(client: UsingClient, settings: SupportSettings, input: CreateTicketInput): Promise<CreateTicketResult> {
        const { userId, username, avatarUrl, subject, message } = input;

        if (SupportSystem.creating.has(userId) || SupportTicketIndex.ofUser(userId).length) return { ok: false, reason: 'tooManyOpen' };
        if (SupportSystem.cooldowns.has(userId)) return { ok: false, reason: 'cooldown' };
        if (SupportSystem.dailyCreations.count(userId) >= 5) return { ok: false, reason: 'dailyLimit' };
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
                await client.messages.write(channel.id, SupportPosts.opening(client, input));
                await client.messages.write(channel.id, SupportPosts.userMessage({ username, avatarUrl }, message));
            } catch (error) {
                client.logger.error('[support] Posting into the new ticket channel failed', error);
                await client.guilds.channels.delete(settings.guildId, channel.id).catch(() => {});
                return { ok: false, reason: 'failed' };
            }

            const ticket: SupportTicket = { ticketId, userId, subject, channelId: channel.id, state: 'open', userMessages: 1 };
            SupportTicketIndex.add(ticket);
            SupportSystem.cooldowns.set(userId, true, 60_000);
            SupportSystem.dailyCreations.hit(userId);

            return { ok: true, ticket };
        } finally {
            SupportSystem.creating.delete(userId);
        }
    }

    /**
     * Whether a channel is one of the open tickets. This runs for every message and every channel
     * deletion the bot sees, in every server, so the guild is compared first — a string comparison
     * against a cached value — and the index is only consulted for the support server's own channels.
     * @param guildId Guild the channel belongs to, or `undefined` for a DM.
     * @param channelId The channel to check.
     * @returns `true` only for a channel of the support server that is a ticket.
     */
    static isTicketChannel(guildId: string | undefined, channelId: string): boolean {
        if (!guildId || guildId !== SupportConfig.get()?.guildId) return false;

        return SupportTicketIndex.getByChannel(channelId) !== undefined;
    }

    /**
     * Forgets a ticket whose channel was deleted by hand: drops it from the index and discards its
     * buffer. Every other channel — which is nearly all of them — is ignored at the guild check.
     * @param guildId Guild the deleted channel belonged to.
     * @param channelId The deleted channel.
     */
    static forgetChannel(guildId: string | undefined, channelId: string): void {
        if (!SupportSystem.isTicketChannel(guildId, channelId)) return;

        SupportTicketIndex.remove(channelId);
        SupportMessageBuffer.drop(channelId);
    }

    /**
     * Reads a ticket's web-visible messages after a cursor.
     * @param client Bot client.
     * @param settings Support settings.
     * @param query The ticket, the cursor and how many messages to return.
     * @returns The messages, oldest first — from the buffer when it reaches that far back, from the channel's history otherwise.
     */
    static messages(client: UsingClient, settings: SupportSettings, query: SupportMessageQuery): Promise<SupportMessage[]> {
        return SupportMessageBuffer.read(client, settings, query);
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
     * @returns The id of the message posted, or why it wasn't.
     */
    static async sendUserMessage(client: UsingClient, ticket: SupportTicket, content: string): Promise<SendMessageResult> {
        if (ticket.state === 'closing') return { ok: false, reason: 'closing' };
        // Keeps one ticket from growing into something the web would refuse to store. The count resets on restart; the transcript's own size cap covers that.
        if (ticket.userMessages >= 300) return { ok: false, reason: 'full' };
        if (SupportSystem.messageCooldowns.has(ticket.userId)) return { ok: false, reason: 'cooldown' };
        // Set before the writes below, so a burst of requests trips it instead of all slipping past.
        SupportSystem.messageCooldowns.set(ticket.userId, true, 2_000);

        try {
            const user = await client.users.fetch(ticket.userId).catch(() => null);
            const author = { username: user ? (user.globalName ?? user.username) : client.t('es').systems.support.message.unknownUser.get(), avatarUrl: user?.avatarURL() ?? null };

            const sent = await client.messages.write(ticket.channelId, SupportPosts.userMessage(author, content));
            ticket.userMessages++;
            return { ok: true, id: sent.id };
        } catch (error) {
            client.logger.error('[support] Posting a user message failed', error);
            return { ok: false, reason: 'failed' };
        }
    }

    /**
     * Permission overwrites for a ticket channel: hidden from everyone, visible to the staff role and the bot.
     * The user never gets access — their side of the conversation is the web.
     * @param client Bot client — its id gets the bot's own overwrite.
     * @param settings Support settings — the guild (its `@everyone` role) and the staff role.
     * @returns The overwrites to create the channel with.
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

    /**
     * Discord rejects a channel in a category that already holds 50 — recognizable only by the error's text.
     * @param error Whatever a failed channel creation threw.
     * @returns Whether it is that rejection.
     */
    private static isCategoryFull(error: unknown): boolean {
        return SeyfertError.is(error) && /maximum number of channels/i.test(String(error.metadata?.detail));
    }
}

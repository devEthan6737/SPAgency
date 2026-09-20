import { randomBytes } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { ChannelType, OverwriteType, PermissionFlagsBits, SeyfertError, type UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import { SupportConfig, type SupportSettings } from './SupportConfig.js';
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

/** Orchestrates a ticket's life on the Discord side — see docs/support.md. */
export class SupportSystem {
    /** Users whose channel is being created right now — makes two quick clicks one ticket, not two. */
    private static creating = new Set<string>();
    private static cooldowns = new ExpiringMap<string, true>();

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

import { ActionRow, Button, ButtonStyle, Embed, EmbedColors, type MessageStructure, type UsingClient } from 'seyfert';
import type { SupportClosedBy } from './SupportTicket.js';

/** Who a web-originated message is attributed to. */
export interface SupportAuthor {
    /** Display name shown as the embed's author. */
    username: string;
    /** Avatar URL, or `null` to post without one. */
    avatarUrl: string | null;
}

/** What {@link SupportPosts.opening} needs to describe a ticket — a subset of the request that opens it. */
export interface SupportOpening {
    /** Discord id of the ticket's owner. */
    userId: string;
    /** Their display name, as sent by the web. */
    username: string;
    /** The ticket's subject. */
    subject: string;
}

/** Builders for everything the bot itself writes into a ticket channel. */
export class SupportPosts {
    /** Footer of every embed that carries a user's message — how the normalizer tells them from the bot's own notices. */
    static readonly WebFooter = 'web';

    /** `customId` of the **Close ticket** button. Not tied to a ticket: the click is resolved by the channel it happens in. */
    static readonly CloseButtonId = 'support-close';

    /**
     * The first message of a ticket: subject, who opened it, and the close button.
     * @param client Bot client, for the localized text.
     * @param opening The ticket's owner and subject.
     * @returns A message body ready for `messages.write`, with mentions switched off.
     */
    static opening(client: UsingClient, { userId, username, subject }: SupportOpening) {
        const t = client.t('es').systems.support.opening;

        return {
            embeds: [new Embed().setColor(EmbedColors.Blurple).setTitle(t.title(subject).get()).setDescription(t.description(userId, username).get())],
            components: [
                new ActionRow<Button>().addComponents(new Button().setCustomId(SupportPosts.CloseButtonId).setLabel(t.closeButton.get()).setStyle(ButtonStyle.Danger))
            ],
            allowed_mentions: { parse: [] }
        };
    }

    /**
     * The notice posted when a close starts. Besides telling the staff, its footer (`close:user` or
     * `close:staff`) records who closed the ticket, so a close resumed after a restart still knows.
     * @param client Bot client, for the localized text.
     * @param closedBy Who closed it.
     * @param staffId Discord id of the staff member, when `closedBy` is `staff`.
     * @returns A message body ready for `messages.write`, with mentions switched off.
     */
    static closeNotice(client: UsingClient, closedBy: SupportClosedBy, staffId?: string) {
        const t = client.t('es').systems.support.close.notice;
        const text = closedBy === 'user' ? t.user.get() : t.staff(staffId ?? '').get();

        return { embeds: [new Embed().setColor(EmbedColors.Red).setDescription(text).setFooter({ text: `close:${closedBy}` })], allowed_mentions: { parse: [] } };
    }

    /**
     * Reads back who closed the ticket from the notice {@link SupportPosts.closeNotice} left in the channel.
     * @param botId The bot's own id — only its messages count.
     * @param messages The channel's raw messages.
     * @returns Who closed it, or `null` if there is no notice, e.g. because posting it failed.
     */
    static closedByOf(botId: string, messages: MessageStructure[]): SupportClosedBy | null {
        for (const message of messages) {
            const match = message.author.id === botId ? /^close:(user|staff)$/.exec(message.embeds[0]?.footer?.text ?? '') : null;
            if (match) return match[1] as SupportClosedBy;
        }

        return null;
    }

    /**
     * A message written by the user on the web, posted as an embed carrying their name and avatar.
     * Mentions are switched off and `@everyone`/`@here` neutralized, so nothing they type can ping anyone.
     * @param author Who wrote it.
     * @param content The message text, already length-checked.
     * @returns A message body ready for `messages.write`.
     */
    static userMessage({ username, avatarUrl }: SupportAuthor, content: string) {
        const embed = new Embed()
            .setColor(EmbedColors.Green)
            .setAuthor({ name: username, ...(avatarUrl && { iconUrl: avatarUrl }) })
            .setDescription(content.replace(/@(everyone|here)/gi, '@\u200B$1'))
            .setFooter({ text: SupportPosts.WebFooter });

        return { embeds: [embed], allowed_mentions: { parse: [] } };
    }
}

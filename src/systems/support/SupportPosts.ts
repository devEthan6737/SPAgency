import { ActionRow, Button, ButtonStyle, Embed, EmbedColors, type UsingClient } from 'seyfert';

/** Who a web-originated message is attributed to. */
export interface SupportAuthor {
    username: string;
    /** Avatar URL, or `null` to post without one. */
    avatarUrl: string | null;
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
     * @param userId Discord id of the ticket's owner.
     * @param username Their display name, as sent by the web.
     * @param subject The ticket's subject.
     */
    static opening(client: UsingClient, userId: string, username: string, subject: string) {
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
     * A message written by the user on the web, posted as an embed carrying their name and avatar.
     * Mentions are switched off and `@everyone`/`@here` neutralized, so nothing they type can ping anyone.
     * @param author Who wrote it.
     * @param content The message text, already length-checked.
     */
    static userMessage({ username, avatarUrl }: SupportAuthor, content: string) {
        const embed = new Embed()
            .setColor(EmbedColors.Green)
            .setAuthor({ name: username, ...(avatarUrl && { iconUrl: avatarUrl }) })
            .setDescription(content.replace(/@(everyone|here)/gi, '@​$1'))
            .setFooter({ text: SupportPosts.WebFooter });

        return { embeds: [embed], allowed_mentions: { parse: [] } };
    }
}

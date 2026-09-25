import { Button, ButtonStyle } from 'seyfert';
import { EmojiKey, Emojis } from '../emojis/index.js';
import { InfoLinkKind, type InfoLink } from './InfoLinks.js';

/** The emoji of each link that gets one. */
const LinkEmojis: Partial<Record<InfoLinkKind, EmojiKey>> = {
    [InfoLinkKind.InviteBot]: EmojiKey.Attachment,
    [InfoLinkKind.Support]: EmojiKey.Partner,
    [InfoLinkKind.Donate]: EmojiKey.Visa
};

/** Draws an {@link InfoLink} as a button. */
export class InfoLinkButton {
    /**
     * @param link The link to draw.
     * @param label The text of the button, in the reader's language.
     * @returns A link button, or a disabled grey one if the link has no address configured.
     */
    static build({ kind, url }: InfoLink, label: string): Button {
        const button = new Button().setLabel(label);
        const emoji = LinkEmojis[kind];
        if (emoji) button.setEmoji(Emojis.get(emoji));

        return url ? button.setStyle(ButtonStyle.Link).setURL(url) : button.setStyle(ButtonStyle.Secondary).setCustomId(`info:unset:${kind}`).setDisabled(true);
    }
}

import {
    ActionRow,
    Button,
    Command,
    Container,
    Declare,
    EmbedColors,
    LocalesT,
    MessageFlags,
    Separator,
    TextDisplay,
    type CommandContext
} from 'seyfert';
import { Emojis, EmojiKey } from '../../systems/emojis/index.js';
import { InfoLinkButton, InfoLinkKind, InfoLinks } from '../../systems/info/index.js';

@Declare({
    name: 'canary',
    description: 'Explains what the canary bot is and how to help test it.',
    props: { category: 'others', canaryOnly: true }
})

@LocalesT('commands.others.canary.name', 'commands.others.canary.description')

/**
 * Explains what the canary bot is, what to expect from it, how it differs from production and how to
 * help, with buttons to the support server and GitHub. Only registered on the canary bot (see
 * `props.canaryOnly` and `CommandAvailability`). Read-only, no side effects.
 */
export default class CanaryCommand extends Command {
    /** Replies with the explanation as one Components V2 card. */
    async run(ctx: CommandContext) {
        const t = ctx.t.commands.others.canary;
        const labels = ctx.t.commands.others.info.links;
        const { priority, secondary } = InfoLinks.resolve(ctx.client.applicationId);
        const buttons = [...priority, ...secondary]
            .filter(({ kind }) => kind === InfoLinkKind.Support || kind === InfoLinkKind.GitHub)
            .map((link) => InfoLinkButton.build(link, labels[link.kind].get()));
        const badge = `${Emojis.get(EmojiKey.BetaStart)}${Emojis.get(EmojiKey.BetaEnd)}`;

        const card = new Container()
            .setColor(EmbedColors.Blurple)
            .addComponents(
                new TextDisplay().setContent(`## ${badge} **::** ${t.title.get()}\n${t.intro.get()}`),
                new Separator(),
                new TextDisplay().setContent(`### ${t.expect.title.get()}\n${t.expect.list.get()}`),
                new Separator(),
                new TextDisplay().setContent(`### ${t.differs.title.get()}\n${t.differs.list.get()}`),
                new Separator(),
                new TextDisplay().setContent(`### ${t.help.title.get()}\n${t.help.text.get()}`),
                new ActionRow<Button>().addComponents(buttons)
            );

        await ctx.write({ components: [card], flags: MessageFlags.IsComponentsV2 });
    }
}

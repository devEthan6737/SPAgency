import {
    ActionRow,
    Button,
    ButtonStyle,
    Command,
    Container,
    Declare,
    EmbedColors,
    LocalesT,
    Section,
    Separator,
    TextDisplay,
    Thumbnail,
    type CommandContext,
    type SeyfertLocale
} from 'seyfert';
import { Emojis, EmojiKey } from '../../systems/emojis/index.js';
import { BotStats, InfoLinkKind, InfoLinks, type BotStatsSnapshot, type InfoLink, type InfoLinkGroups } from '../../systems/info/index.js';
import { BotEnvironment, getBotEnvironment } from '../../systems/shared/Environment.js';
import { formatDuration } from '../../systems/shared/Duration.js';
import { Paginator } from '../../systems/shared/pagination/index.js';

/** Locale accessor for this command's strings. */
type InfoLocale = SeyfertLocale['commands']['others']['info'];

/** The pages of the card, in order. The first is the one people should land on: it holds the links. */
enum InfoPage {
    General = 'general',
    Technical = 'technical'
}

/** Everything the pages are drawn from, gathered once so paging never waits on anything. */
interface InfoData {
    t: InfoLocale;
    stats: BotStatsSnapshot;
    uptime: string;
    /** The BETA badge markup, or an empty string outside the canary bot. */
    badge: string;
    avatar: string | null | undefined;
    links: InfoLinkGroups;
}

/** The emoji of each link that gets a button. */
const LinkEmojis: Partial<Record<InfoLinkKind, EmojiKey>> = {
    [InfoLinkKind.InviteBot]: EmojiKey.Attachment,
    [InfoLinkKind.Support]: EmojiKey.Partner,
    [InfoLinkKind.Donate]: EmojiKey.Visa
};

@Declare({
    name: 'info',
    description: 'Shows information about the bot.',
    aliases: ['ayuda', 'help', 'about', 'acerca', 'botinfo', 'informacion'],
    props: { category: 'others' }
})

@LocalesT('commands.others.info.name', 'commands.others.info.description')

/**
 * Shows the bot's links, stack, live numbers and credits as a paged Components V2 card. Read-only, no side effects.
 * Page one is the general one, with the important links as buttons; page two is the technical one.
 */
export default class InfoCommand extends Command {
    /** Gathers the numbers, then sends the paged card. */
    async run(ctx: CommandContext) {
        const t = ctx.t.commands.others.info;
        const data: InfoData = {
            t,
            stats: await BotStats.collect(ctx.client),
            uptime: formatDuration(process.uptime() * 1_000, t.stats.uptimeWords.get()),
            badge: getBotEnvironment() === BotEnvironment.Canary ? `${Emojis.get(EmojiKey.BetaStart)}${Emojis.get(EmojiKey.BetaEnd)} **::** ` : '',
            avatar: ctx.client.me.avatarURL(),
            links: InfoLinks.resolve(ctx.client.applicationId)
        };
        const pages = [InfoPage.General, InfoPage.Technical];

        await new Paginator(ctx, {
            data: pages,
            itemsPerPage: 1,
            content: ([page]) => (page === InfoPage.General ? this.general(data) : this.technical(data)),
            middle: (view) =>
                new Button()
                    .setCustomId('info:page')
                    .setLabel(`${view.page}/${view.totalPages} · ${data.t.pages[pages[view.page - 1]].get()}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
        }).start();
    }

    /**
     * Page one: the intro, the priority links as buttons (disabled ones for links not configured), then the secondary links and the credits in small text.
     * @param data What to draw from.
     * @returns The page's container.
     */
    private general({ t, badge, avatar, links }: InfoData): Container {
        const intro = new TextDisplay().setContent(t.about(badge).get());
        const card = new Container()
            .setColor(EmbedColors.Blurple)
            .addComponents(avatar ? new Section().addComponents(intro).setAccessory(new Thumbnail().setMedia(avatar)) : intro);

        const buttons = links.priority.map((link) => this.linkButton(link, t));
        card.addComponents(new Separator(), new ActionRow<Button>().addComponents(buttons), new Separator());

        const line = links.secondary.map(({ kind, url }) => (url ? `[${t.links[kind].get()}](${url})` : t.links[kind].get())).join(' · ');
        card.addComponents(new TextDisplay().setContent(`-# ${line}`));

        return card.addComponents(new TextDisplay().setContent(`-# ${t.credits.text.get()}`));
    }

    /**
     * @param link The link to draw.
     * @param t The command's strings.
     * @returns A link button, or a disabled grey one if the link has no address configured.
     */
    private linkButton({ kind, url }: InfoLink, t: InfoLocale): Button {
        const button = new Button().setLabel(t.links[kind].get());
        const emoji = LinkEmojis[kind];
        if (emoji) button.setEmoji(Emojis.get(emoji));

        return url ? button.setStyle(ButtonStyle.Link).setURL(url) : button.setStyle(ButtonStyle.Secondary).setCustomId(`info:unset:${kind}`).setDisabled(true);
    }

    /**
     * Page two: what the bot is built with, the live counts and the resource use.
     * @param data What to draw from.
     * @returns The page's container.
     */
    private technical({ t, stats, uptime }: InfoData): Container {
        const counts = { guilds: stats.guilds, users: stats.users, commands: stats.commands, uptime };

        return new Container()
            .setColor(EmbedColors.Blurple)
            .addComponents(
                new TextDisplay().setContent(`### ${t.stack.title.get()}\n${t.stack.list.get()}`),
                new Separator(),
                new TextDisplay().setContent(`### ${t.stats.title.get()}\n${t.stats.list(counts).get()}`),
                new Separator(),
                new TextDisplay().setContent(`### ${t.resources.title.get()}\n${t.resources.list(stats.cpuPercent, stats.ramMb).get()}`)
            );
    }
}

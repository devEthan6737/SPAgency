import { Command, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { getUbfb } from '../../systems/ubfb/client.js';

const options = {
    user: createUserOption({
        description: 'User to check. Defaults to yourself.',
        required: false,
        locales: {
            name: 'commands.others.me.option.name',
            description: 'commands.others.me.option.description'
        }
    })
};

@Declare({
    name: 'me',
    description: 'Checks if you (or a user) are on the UBFB blacklist.',
    props: { category: 'others' }
})

@LocalesT('commands.others.me.name', 'commands.others.me.description')

@Options(options)

export default class MeCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        const t = ctx.t.commands.others.me;
        const targetId = ctx.options.user?.id ?? ctx.author.id;
        const ubfb = getUbfb();

        if (!ubfb.isBlacklisted(targetId)) {
            await ctx.write({ content: t.clean(targetId).get() });
            return;
        }

        const entry = await ubfb.getBlacklistEntry(targetId);
        if (!entry) {
            await ctx.write({ content: t.clean(targetId).get() });
            return;
        }

        const embed = new Embed()
            .setColor(EmbedColors.Red)
            .setDescription(t.blacklisted(targetId).get())
            .addFields(
                { name: t.reason.get(), value: entry.reason, inline: true },
                { name: t.status.get(), value: entry.status, inline: true }
            );

        if (entry.proofs[0]) embed.setImage(entry.proofs[0]);

        await ctx.write({ embeds: [embed] });
    }
}

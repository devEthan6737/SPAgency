import { Command, createStringOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    id: createStringOption({
        description: "ID of the user to ban — doesn't need to be a member of this server.",
        required: true,
        locales: {
            name: 'commands.moderation.hackban.option.id.name',
            description: 'commands.moderation.hackban.option.id.description'
        }
    }),
    reason: createStringOption({
        description: 'Ban reason.',
        required: false,
        locales: {
            name: 'commands.moderation.hackban.option.reason.name',
            description: 'commands.moderation.hackban.option.reason.description'
        }
    })
};

@Declare({
    name: 'hackban',
    description: "Bans a user who isn't a member of your server, by id.",
    aliases: ['banid'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.hackban.name', 'commands.moderation.hackban.description')

@Options(options)

export default class HackbanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.hackban;
        const guild = await ctx.guild();
        const userId = ctx.options.id;

        if (!/^\d{17,20}$/.test(userId)) {
            await ctx.write({ content: t.invalidId.get() });
            return;
        }
        if (userId === ctx.client.botId || userId === ctx.author.id) return await ctx.write({ content: ctx.t.commands.moderation.shared.cannotTargetSelf.get() });
        const reason = ctx.options.reason ?? ctx.t.commands.moderation.shared.defaultReason.get();

        try {
            await guild.bans.create(userId, { reason });
        } catch {
            return await ctx.write({ content: t.failed.get() });
        }

        const embed = new Embed().setColor(EmbedColors.Red).setDescription(t.done(userId, reason).get());
        await ctx.write({ embeds: [embed] });
    }
}

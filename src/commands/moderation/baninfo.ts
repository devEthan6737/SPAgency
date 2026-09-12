import { Command, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    user: createUserOption({
        description: 'User to check.',
        required: true,
        locales: {
            name: 'commands.moderation.baninfo.option.user.name',
            description: 'commands.moderation.baninfo.option.user.description'
        }
    })
};

@Declare({
    name: 'baninfo',
    description: "Shows a server ban's details.",
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.baninfo.name', 'commands.moderation.baninfo.description')

@Options(options)

/** Looks up and displays the details of an existing server ban for the given user. */
export default class BaninfoCommand extends Command {
    /** Fetches the ban by user id and replies with its reason, or a "not banned" message if none exists. */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.baninfo;
        const guild = await ctx.guild();

        const ban = await guild.bans.fetch(ctx.options.user.id).catch(() => undefined);
        if (!ban) return await ctx.write({ content: t.notBanned.get() });

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Blue).setDescription(t.info(ban.user.username, ban.reason ?? t.noReason.get()).get())
        ] });
    }
}

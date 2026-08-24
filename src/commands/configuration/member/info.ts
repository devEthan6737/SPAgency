import { createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to look up.',
        required: true,
        locales: {
            name: 'commands.configuration.member.info.option.member.name',
            description: 'commands.configuration.member.info.option.member.description'
        }
    })
};

@Declare({
    name: 'info',
    description: 'Shows information about a member.'
})

@LocalesT('commands.configuration.member.info.name', 'commands.configuration.member.info.description')

@Options(options)

export default class InfoSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.member.info;

        const guild = await ctx.guild();
        const member = await guild.members.fetch(ctx.options.member.id);

        const embed = new Embed()
            .setColor(EmbedColors.Blue)
            .setAuthor({ name: member.user?.username ?? member.id, iconUrl: member.avatarURL() })
            .addFields(
                { name: t.id.get(), value: member.id, inline: true },
                { name: t.nickname.get(), value: member.nick ?? t.noNickname.get(), inline: true },
                { name: t.joinedAt.get(), value: `<t:${Math.floor((member.joinedTimestamp ?? 0) / 1000)}:D>`, inline: true },
                {
                    name: t.roles.get(),
                    value: member.roles.keys.length ? member.roles.keys.map((role) => `<@&${role}>`).join(', ') : t.noRoles.get()
                }
            );

        await ctx.write({ embeds: [embed] });
    }
}

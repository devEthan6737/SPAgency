import { ChannelType, createStringOption, Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    name: createStringOption({
        description: 'Name for the new channel.',
        required: true,
        locales: {
            name: 'commands.configuration.channel.create.option.name.name',
            description: 'commands.configuration.channel.create.option.name.description'
        }
    })
};

@Declare({
    name: 'create',
    description: 'Creates a new text channel.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels']
})

@LocalesT('commands.configuration.channel.create.name', 'commands.configuration.channel.create.description')

@Options(options)

export default class CreateSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const guild = await ctx.guild();
        await guild.channels.create({ name: ctx.options.name, type: ChannelType.GuildText });

        await ctx.write({ content: ctx.t.commands.configuration.channel.created.get() });
    }
}

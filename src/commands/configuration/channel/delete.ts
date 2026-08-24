import { createChannelOption, Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    channel: createChannelOption({
        description: 'Channel to delete.',
        required: true,
        locales: {
            name: 'commands.configuration.channel.delete.option.channel.name',
            description: 'commands.configuration.channel.delete.option.channel.description'
        }
    })
};

@Declare({
    name: 'delete',
    description: 'Deletes a channel.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels']
})

@LocalesT('commands.configuration.channel.delete.name', 'commands.configuration.channel.delete.description')

@Options(options)

export default class DeleteSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const guild = await ctx.guild();
        await guild.channels.delete(ctx.options.channel.id);

        await ctx.write({ content: ctx.t.commands.configuration.channel.deleted.get() });
    }
}

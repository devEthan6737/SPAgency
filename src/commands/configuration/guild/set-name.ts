import { createStringOption, Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    name: createStringOption({
        description: 'New server name.',
        required: true,
        locales: {
            name: 'commands.configuration.guild.setName.option.name.name',
            description: 'commands.configuration.guild.setName.option.name.description'
        }
    })
};

@Declare({
    name: 'set-name',
    description: "Changes the server's name.",
    botPermissions: ['ManageGuild'],
    defaultMemberPermissions: ['ManageGuild']
})

@LocalesT('commands.configuration.guild.setName.name', 'commands.configuration.guild.setName.description')

@Options(options)

export default class SetNameSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        
        const guild = await ctx.guild();
        await guild.edit({ name: ctx.options.name });
        await ctx.write({ content: ctx.t.commands.configuration.guild.setName.done.get() });
    }
}

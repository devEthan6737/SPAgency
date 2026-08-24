import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'member',
    description: 'Manage your server members.',
    aliases: ['user'],
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.member.name', 'commands.configuration.member.description')

@AutoLoad()

export default class MemberCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.member.usage.get() });
    }
}

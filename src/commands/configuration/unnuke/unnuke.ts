import { AutoLoad, Command, Declare, LocalesT, Middlewares, type CommandContext } from 'seyfert';

@Declare({
    name: 'unnuke',
    description: 'Automated cleanup after a raid: duplicate channels/roles/emojis, or a mass-ban.',
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.unnuke.name', 'commands.configuration.unnuke.description')

@Middlewares(['isOwner'])

@AutoLoad()

export default class UnnukeCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.unnuke.usage.get() });
    }
}

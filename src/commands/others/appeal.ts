import { Command, Declare, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'appeal',
    description: 'Tells you where to appeal if you are on the UBFB blacklist.',
    aliases: ['apelar'],
    props: { category: 'others' }
})

@LocalesT('commands.others.appeal.name', 'commands.others.appeal.description')

export default class AppealCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.others.appeal.message.get() });
    }
}

import { Command, Declare, LocalesT, type CommandContext } from 'seyfert';

@Declare({
    name: 'appeal',
    description: 'Tells you where to appeal if you are on the UBFB blacklist.',
    aliases: ['apelar'],
    props: { category: 'others' }
})

@LocalesT('commands.others.appeal.name', 'commands.others.appeal.description')

/** Tells the invoker where to go to appeal a UBFB blacklist entry. Purely informational, no side effects. */
export default class AppealCommand extends Command {
    /** Replies with the appeal instructions text. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.others.appeal.message.get() });
    }
}

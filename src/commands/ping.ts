import { Command, Declare, type CommandContext } from 'seyfert';

@Declare({
    name: 'ping',
    description: 'Muestra la latencia del bot.'
})
export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const start = Date.now();
        await ctx.write({ content: 'Calculando...' });
        await ctx.editOrReply({ content: `Pong! ${Date.now() - start}ms` });
    }
}

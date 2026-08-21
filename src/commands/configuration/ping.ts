import { sql } from 'drizzle-orm';
import { Command, Declare, LocalesT, type CommandContext } from 'seyfert';
import { db } from '../../database/connection.js';

@Declare({
    name: 'ping',
    description: 'Muestra la latencia del bot.',
    props: { category: 'configuration' }
})

@LocalesT('commands.configuration.ping.name', 'commands.configuration.ping.description')

export default class PingCommand extends Command {
    async run(ctx: CommandContext) {
        const start = Date.now();
        await ctx.write({ content: ctx.t.commands.configuration.ping.calculating.get() });

        const messageLatency = Date.now() - start;
        const apiLatency = Math.round(ctx.client.gateway.latency);
        await ctx.editOrReply({ content: ctx.t.commands.configuration.ping.latency(messageLatency, apiLatency).get() });

        const dbStart = Date.now();
        await db.execute(sql`select 1`);
        const dbLatency = Date.now() - dbStart;

        await ctx.editOrReply({
            content: ctx.t.commands.configuration.ping.withDatabase(messageLatency, apiLatency, dbLatency).get()
        });
    }
}

import { Command, createIntegerOption, Declare, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    amount: createIntegerOption({
        description: 'How many messages to delete (1-1000).',
        required: true,
        min_value: 1,
        max_value: 1000,
        locales: {
            name: 'commands.moderation.clear.option.amount.name',
            description: 'commands.moderation.clear.option.amount.description'
        }
    })
};

@Declare({
    name: 'clear',
    description: 'Bulk-deletes messages from this channel.',
    botPermissions: ['ManageMessages'],
    defaultMemberPermissions: ['ManageMessages'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.clear.name', 'commands.moderation.clear.description')

@Options(options)

export default class ClearCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const channel = await ctx.channel();
        if (!('messages' in channel)) return;

        let remaining = ctx.options.amount;
        let deleted = 0;

        while (remaining > 0) {
            const batch = await channel.messages.list({ limit: Math.min(remaining, 100) });
            if (!batch.length) break;

            await channel.messages.purge(batch.map((message) => message.id));
            deleted += batch.length;
            remaining -= batch.length;

            if (batch.length < 100) break;
        }

        await ctx.write({ content: ctx.t.commands.moderation.clear.done(deleted).get() });
    }
}

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

/**
 * Parent command grouping the raid-cleanup subcommands (`bans`, `channels`, `emojis`, `roles`).
 * Requires Administrator and is restricted to the guild owner via the `isOwner` middleware;
 * this class itself only replies with usage — the actual work lives in each subcommand.
 */
export default class UnnukeCommand extends Command {
    /** Replies with the parent command's usage text; invoked when `/unnuke` is run without a subcommand. */
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.configuration.unnuke.usage.get() });
    }
}

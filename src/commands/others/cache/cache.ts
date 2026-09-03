import { AutoLoad, Command, Declare, LocalesT, type CommandContext } from 'seyfert';

/**
 * Internal debug tooling for `GuildConfigCache` — never registered in production (see
 * `props.devOnly` and `src/index.ts`). Only exists on the canary/testing and local-dev bots, where
 * "who can run it" is already answered by which bot application is even installed where (see
 * docs — testers know the canary bot, a dev's own bot is only in their one test server).
 */
@Declare({
    name: 'cache',
    description: "Inspect/warm/invalidate a guild's GuildConfigCache entry. Dev tooling, not for guild admins.",
    defaultMemberPermissions: ['Administrator'],
    props: { category: 'others', devOnly: true }
})

@LocalesT('commands.others.cache.name', 'commands.others.cache.description')

@AutoLoad()

export default class CacheCommand extends Command {
    async run(ctx: CommandContext) {
        await ctx.write({ content: ctx.t.commands.others.cache.usage.get() });
    }
}

import { Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { GuildConfigCache } from '../../../systems/protection/index.js';
import { cacheGuildIdOption, resolveCacheGuildId } from './shared.js';

/**
 * Forces a genuine cache miss (unlike just re-running `get()`, which would come back instantly if
 * still warm) and times the round-trip to Postgres — a quick way to tell, straight from Discord,
 * whether the database is responding slowly, without SSHing into the VPS.
 */
@Declare({
    name: 'hit',
    description: 'Forces a cache miss for a guild and reports how long re-fetching it took.'
})

@LocalesT('commands.others.cache.hit.name', 'commands.others.cache.hit.description')

@Options(cacheGuildIdOption)

export default class HitSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof cacheGuildIdOption>) {
        const t = ctx.t.commands.others.cache;

        const guildId = resolveCacheGuildId(ctx);
        if (!guildId) return await ctx.write({ content: t.noGuild.get() });

        GuildConfigCache.invalidate(guildId);

        const startedAt = performance.now();
        const settings = await GuildConfigCache.get(guildId);
        const elapsedMs = performance.now() - startedAt;

        if (!settings) return await ctx.write({ content: t.noRow(guildId).get() });

        await ctx.write({ content: t.hitResult(elapsedMs.toFixed(1)).get() });
    }
}

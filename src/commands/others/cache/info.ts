import { Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { GuildConfigCache } from '../../../systems/protection/index.js';
import { cacheGuildIdOption, resolveCacheGuildId } from './shared.js';

@Declare({
    name: 'info',
    description: "Shows what's currently cached for a guild, without touching the database."
})

@LocalesT('commands.others.cache.info.name', 'commands.others.cache.info.description')

@Options(cacheGuildIdOption)

export default class InfoSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof cacheGuildIdOption>) {
        const t = ctx.t.commands.others.cache;

        const guildId = resolveCacheGuildId(ctx);
        if (!guildId) return await ctx.write({ content: t.noGuild.get() });

        const cached = GuildConfigCache.peek(guildId);
        if (!cached) return await ctx.write({ content: t.notCached(guildId).get() });

        await ctx.write({ content: `\`\`\`json\n${JSON.stringify(cached, null, 2)}\n\`\`\`` });
    }
}

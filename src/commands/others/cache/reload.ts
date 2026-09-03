import { Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { GuildConfigCache } from '../../../systems/protection/index.js';
import { cacheGuildIdOption, resolveCacheGuildId } from './shared.js';

/**
 * Escape hatch for the rare case a `guild_config_changed` NOTIFY got missed (the bot was
 * disconnected right when it fired) — forces a fresh read instead of waiting for the 10-minute
 * safety-net clear in `GuildConfigCache.start`.
 */
@Declare({
    name: 'reload',
    description: "Force-invalidates and re-fetches a guild's cache entry."
})

@LocalesT('commands.others.cache.reload.name', 'commands.others.cache.reload.description')

@Options(cacheGuildIdOption)

export default class ReloadSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof cacheGuildIdOption>) {
        const t = ctx.t.commands.others.cache;

        const guildId = resolveCacheGuildId(ctx);
        if (!guildId) return await ctx.write({ content: t.noGuild.get() });

        GuildConfigCache.invalidate(guildId);
        const settings = await GuildConfigCache.get(guildId);

        await ctx.write({ content: settings ? t.reloaded(guildId).get() : t.noRow(guildId).get() });
    }
}

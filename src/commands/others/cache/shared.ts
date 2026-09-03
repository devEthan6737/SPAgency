import { createStringOption, type CommandContext } from 'seyfert';

/** Shared `guild_id` option for every `/cache` subcommand — defaults to the current guild when omitted, but staff running this from a DM (or checking a guild they aren't in) can target any guild id directly. */
export const cacheGuildIdOption = {
    guild_id: createStringOption({
        description: 'Guild id to check — defaults to the current server.',
        required: false,
        locales: {
            name: 'commands.others.cache.option.guildId.name',
            description: 'commands.others.cache.option.guildId.description'
        }
    })
};

/** Resolves which guild a `/cache` subcommand should act on: the `guild_id` option if given, otherwise the guild the command ran in. `null` if neither is available (e.g. run from a DM with no `guild_id`). */
export function resolveCacheGuildId(ctx: CommandContext<typeof cacheGuildIdOption>): string | null {
    return ctx.options.guild_id ?? ctx.guildId ?? null;
}

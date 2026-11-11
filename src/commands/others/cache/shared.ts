import { createStringOption, type APIApplication, type CommandContext, type UsingClient } from 'seyfert';

/** Shared `guild_id` option for every `/cache` subcommand: defaults to the current guild when omitted, and only the application's owner or team may point it at another one. */
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

/** Decides which guild a `/cache` subcommand acts on, and who may look at a guild other than the one it ran in. */
export class CacheGuild {
    /** Ids of the application's owner and team members, read once from Discord and kept. */
    private static ownerIds: Set<string> | undefined;

    /**
     * Resolves which guild a `/cache` subcommand should act on: the current guild by default, or the
     * `guild_id` option, which only the application's owner or team may use to look at a guild other
     * than the one the command ran in. Otherwise the cached settings of any server would be readable by
     * whoever has Administrator anywhere the bot is installed (or by anyone, from a DM).
     * @param ctx The subcommand's context.
     * @returns The guild id, or `null` if there is none or the invoker may not look at the one asked for.
     */
    static async resolve(ctx: CommandContext<typeof cacheGuildIdOption>): Promise<string | null> {
        const requested = ctx.options.guild_id;
        if (!requested || requested === ctx.guildId) return ctx.guildId ?? null;

        return (await CacheGuild.isApplicationOwner(ctx.client, ctx.author.id).catch(() => false)) ? requested : null;
    }

    /**
     * @param client Bot client, to read the application from Discord the first time.
     * @param userId The user to check.
     * @returns Whether `userId` owns the bot's application, directly or through its team.
     */
    private static async isApplicationOwner(client: UsingClient, userId: string): Promise<boolean> {
        if (!CacheGuild.ownerIds) {
            const application: APIApplication = await client.proxy.applications('@me').get();
            CacheGuild.ownerIds = new Set([application.owner?.id, ...(application.team?.members.map((member) => member.user.id) ?? [])].filter((id): id is string => !!id));
        }

        return CacheGuild.ownerIds.has(userId);
    }
}

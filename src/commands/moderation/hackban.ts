import { Command, createStringOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';
import { ForceReasons, ModerationGuard } from '../../systems/moderation/index.js';

const options = {
    id: createStringOption({
        description: "ID of the user to ban — doesn't need to be a member of this server.",
        required: true,
        locales: {
            name: 'commands.moderation.hackban.option.id.name',
            description: 'commands.moderation.hackban.option.id.description'
        }
    }),
    reason: createStringOption({
        description: 'Ban reason.',
        required: false,
        autocomplete: ForceReasons.autocomplete,
        locales: {
            name: 'commands.moderation.hackban.option.reason.name',
            description: 'commands.moderation.hackban.option.reason.description'
        }
    })
};

@Declare({
    name: 'hackban',
    description: "Bans a user who isn't a member of your server, by id.",
    aliases: ['banid'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.hackban.name', 'commands.moderation.hackban.description')

@Options(options)

/** Bans a user by id, whether or not they are a member of the server. */
export default class HackbanCommand extends Command {
    /**
     * Validates the id looks like a snowflake, rejects the bot or self, applies the invoker-vs-target
     * hierarchy check when the id belongs to a member (it can't apply to non-members), resolves a
     * reason via `ForceReasons`, then bans by id.
     */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.hackban;
        const shared = ctx.t.commands.moderation.shared;
        const guild = await ctx.guild();
        const userId = ctx.options.id;

        if (!/^\d{17,20}$/.test(userId)) return await ctx.write({ content: t.invalidId.get() });
        if (userId === ctx.client.botId) return await ctx.write({ content: shared.cannotTargetBot.get() });
        if (userId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });

        const target = await guild.members.fetch(userId).catch(() => undefined);
        if (target && !(await ModerationGuard.outranks(ctx.member, target, guild.ownerId))) return await ctx.write({ content: shared.hierarchyError.get() });

        const forced = await ForceReasons.resolve(guild.id, ctx.options.reason, shared.defaultReason.get());
        if (!forced.ok) return await ctx.write({ content: shared.forceReasonRequired(forced.allowed).get() });
        const reason = forced.reason;

        try {
            await guild.bans.create(userId, { reason });
        } catch {
            return await ctx.write({ content: t.failed.get() });
        }
        void dispatchLog(ctx.client, HackbanCommand.log({ guildId: guild.id, targetId: userId, executorId: ctx.author.id, reason })).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(t.done(userId, reason).get())
        ] });
    }

    /** Builds the `BotActionLog` entry recording the ban. */
    private static log({ guildId, targetId, executorId, reason }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Hackban,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.hackban(targetId, reason).get(),
            targetId,
            executorId,
            reason
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    reason: string;
}

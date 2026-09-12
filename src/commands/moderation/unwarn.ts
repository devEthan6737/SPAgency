import { Command, createBooleanOption, createIntegerOption, createUserOption, Declare, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { WarnRepository } from '../../database/repositories/warn.repository.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

const options = {
    member: createUserOption({
        description: 'Member to remove a warning from.',
        required: true,
        locales: {
            name: 'commands.moderation.unwarn.option.member.name',
            description: 'commands.moderation.unwarn.option.member.description'
        }
    }),
    id: createIntegerOption({
        description: 'ID of the specific warning to remove (see /warns).',
        required: false,
        locales: {
            name: 'commands.moderation.unwarn.option.id.name',
            description: 'commands.moderation.unwarn.option.id.description'
        }
    }),
    all: createBooleanOption({
        description: "Remove all of this member's warnings instead of one.",
        required: false,
        locales: {
            name: 'commands.moderation.unwarn.option.all.name',
            description: 'commands.moderation.unwarn.option.all.description'
        }
    })
};

@Declare({
    name: 'unwarn',
    description: "Removes one (or all) of a member's warnings.",
    defaultMemberPermissions: ['ManageMessages'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.unwarn.name', 'commands.moderation.unwarn.description')

@Options(options)

/**
 * Removes one warning (by ID) or all warnings from a member's record.
 */
export default class UnwarnCommand extends Command {
    /**
     * Deletes all of the target's warnings when `all` is set; otherwise deletes the
     * warning matching `id`. Requires one of the two options to be provided.
     */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.unwarn;
        const shared = ctx.t.commands.moderation.shared;
        const targetId = ctx.options.member.id;

        if (targetId === ctx.client.botId) return await ctx.write({ content: shared.cannotTargetBot.get() });
        if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });

        if (ctx.options.all) {
            const removed = await WarnRepository.deleteAll(ctx.guildId, targetId);
            void dispatchLog(ctx.client, UnwarnCommand.log({ guildId: ctx.guildId, targetId, executorId: ctx.author.id, warnId: 'all' })).catch(() => {});
            return await ctx.write({ content: t.doneAll(targetId, removed.length).get() });
        }

        if (ctx.options.id === undefined) return await ctx.write({ content: t.needsIdOrAll.get() });

        const removed = await WarnRepository.deleteById(ctx.guildId, targetId, ctx.options.id);
        if (!removed.length) return await ctx.write({ content: t.notFound.get() });

        void dispatchLog(ctx.client, UnwarnCommand.log({ guildId: ctx.guildId, targetId, executorId: ctx.author.id, warnId: ctx.options.id })).catch(() => {});
        await ctx.write({ content: t.done(targetId, ctx.options.id).get() });
    }

    private static log({ guildId, targetId, executorId, warnId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Unwarn,
            color: EmbedColors.Green,
            describe: (t) => t.systems.logs.actions.unwarn(targetId, warnId).get(),
            targetId,
            executorId,
            data: { warnId }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    warnId: number | 'all';
}

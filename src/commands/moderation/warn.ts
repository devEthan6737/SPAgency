import { Command, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { WarnRepository } from '../../database/repositories/warn.repository.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';
import { ForceReasons } from '../../systems/moderation/index.js';

const options = {
    member: createUserOption({
        description: 'Member to warn.',
        required: true,
        locales: {
            name: 'commands.moderation.warn.option.member.name',
            description: 'commands.moderation.warn.option.member.description'
        }
    }),
    reason: createStringOption({
        description: 'Warn reason.',
        required: true,
        autocomplete: ForceReasons.autocomplete,
        locales: {
            name: 'commands.moderation.warn.option.reason.name',
            description: 'commands.moderation.warn.option.reason.description'
        }
    })
};

@Declare({
    name: 'warn',
    description: 'Adds a warning to a member.',
    botPermissions: ['ManageRoles'],
    defaultMemberPermissions: ['ManageMessages'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.warn.name', 'commands.moderation.warn.description')

@Options(options)

export default class WarnCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.warn;
        const shared = ctx.t.commands.moderation.shared;
        const targetId = ctx.options.member.id;

        if (targetId === ctx.client.botId) return await ctx.write({ content: shared.cannotTargetBot.get() });
        if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });

        const forced = await ForceReasons.resolve(ctx.guildId, ctx.options.reason);
        if (!forced.ok) return await ctx.write({ content: shared.forceReasonRequired(forced.allowed).get() });
        const reason = forced.reason;

        await WarnRepository.create(ctx.guildId, targetId, ctx.author.id, reason);
        const total = await WarnRepository.list(ctx.guildId, targetId);

        void dispatchLog(ctx.client, WarnCommand.log({ guildId: ctx.guildId, targetId, executorId: ctx.author.id, reason })).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Yellow).setDescription(t.done(targetId, total.length, reason).get())
        ] });
    }

    private static log({ guildId, targetId, executorId, reason }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Warn,
            color: EmbedColors.Yellow,
            describe: (t) => t.systems.logs.actions.warn(targetId, reason).get(),
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

import { Command, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

const options = {
    member: createUserOption({
        description: 'Member to remove the timeout from.',
        required: true,
        locales: {
            name: 'commands.moderation.untimeout.option.member.name',
            description: 'commands.moderation.untimeout.option.member.description'
        }
    })
};

@Declare({
    name: 'untimeout',
    description: "Removes a member's timeout.",
    aliases: ['ut'],
    botPermissions: ['ModerateMembers'],
    defaultMemberPermissions: ['ModerateMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.untimeout.name', 'commands.moderation.untimeout.description')

@Options(options)

export default class UntimeoutCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.untimeout;
        const shared = ctx.t.commands.moderation.shared;
        const guild = await ctx.guild();
        const targetId = ctx.options.member.id;

        if (targetId === ctx.client.botId) return await ctx.write({ content: shared.cannotTargetBot.get() });
        if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });

        const target = await guild.members.fetch(targetId).catch(() => undefined);
        if (!target) return await ctx.write({ content: t.notAMember.get() });

        if (ctx.member.id !== guild.ownerId) {
            const [invokerHighest, targetHighest] = await Promise.all([ctx.member.roles.highest(), target.roles.highest()]);
            if ((invokerHighest?.position ?? 0) <= (targetHighest?.position ?? 0)) {
                return await ctx.write({ content: shared.hierarchyError.get() });
            }
        }

        try {
            await target.timeout(null);
        } catch {
            return await ctx.write({ content: t.failed.get() });
        }
        
        void dispatchLog(ctx.client, UntimeoutCommand.log({ guildId: guild.id, targetId, executorId: ctx.author.id })).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Green).setDescription(t.done(targetId).get())
        ] });
    }

    private static log({ guildId, targetId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Untimeout,
            color: EmbedColors.Green,
            describe: (t) => t.systems.logs.actions.untimeout(targetId).get(),
            targetId,
            executorId
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
}

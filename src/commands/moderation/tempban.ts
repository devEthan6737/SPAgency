import { Command, createIntegerOption, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { TempbanRepository } from '../../database/repositories/tempban.repository.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

const options = {
    member: createUserOption({
        description: 'Member to temp-ban.',
        required: true,
        locales: {
            name: 'commands.moderation.tempban.option.member.name',
            description: 'commands.moderation.tempban.option.member.description'
        }
    }),
    minutes: createIntegerOption({
        description: 'Ban duration in minutes (minimum 2).',
        required: true,
        min_value: 2,
        locales: {
            name: 'commands.moderation.tempban.option.minutes.name',
            description: 'commands.moderation.tempban.option.minutes.description'
        }
    }),
    reason: createStringOption({
        description: 'Ban reason.',
        required: false,
        locales: {
            name: 'commands.moderation.tempban.option.reason.name',
            description: 'commands.moderation.tempban.option.reason.description'
        }
    })
};

@Declare({
    name: 'tempban',
    description: 'Bans a member for a set duration, then unbans them automatically.',
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.tempban.name', 'commands.moderation.tempban.description')

@Options(options)

export default class TempbanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.tempban;
        const shared = ctx.t.commands.moderation.shared;
        const guild = await ctx.guild();
        const targetId = ctx.options.member.id;

        if (targetId === ctx.client.botId) return await ctx.write({ content: shared.cannotTargetBot.get() });
        if (targetId === ctx.author.id) return await ctx.write({ content: shared.cannotTargetSelf.get() });

        const target = await guild.members.fetch(targetId).catch(() => undefined);
        if (target && ctx.member.id !== guild.ownerId) {
            const [invokerHighest, targetHighest] = await Promise.all([ctx.member.roles.highest(), target.roles.highest()]);
            if ((invokerHighest?.position ?? 0) <= (targetHighest?.position ?? 0)) {
                return await ctx.write({ content: shared.hierarchyError.get() });
            }
        }

        const reason = ctx.options.reason ?? shared.defaultReason.get();
        const expiresAt = new Date(Date.now() + ctx.options.minutes * 60_000);

        await ctx.options.member.write({ content: shared.dm(guild.name, reason).get() }).catch(() => {});
        await guild.bans.create(targetId, { reason });
        await TempbanRepository.create(guild.id, targetId, t.autoUnbanReason.get(), expiresAt);
        
        void dispatchLog(
            ctx.client,
            TempbanCommand.log({
                guildId: guild.id,
                targetId,
                executorId: ctx.author.id,
                minutes: ctx.options.minutes,
                reason
            })
        ).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(t.done(targetId, ctx.options.minutes, reason).get())
        ] });
    }

    private static log({ guildId, targetId, executorId, minutes, reason }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Tempban,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.tempban(targetId, minutes, reason).get(),
            targetId,
            executorId,
            reason,
            data: { minutes }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    minutes: number;
    reason: string;
}

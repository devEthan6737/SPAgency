import { Command, createIntegerOption, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to time out.',
        required: true,
        locales: {
            name: 'commands.moderation.timeout.option.member.name',
            description: 'commands.moderation.timeout.option.member.description'
        }
    }),
    minutes: createIntegerOption({
        description: "Duration in minutes (10-40320, Discord's 28-day cap).",
        required: true,
        min_value: 10,
        max_value: 40_320,
        locales: {
            name: 'commands.moderation.timeout.option.minutes.name',
            description: 'commands.moderation.timeout.option.minutes.description'
        }
    }),
    reason: createStringOption({
        description: 'Timeout reason.',
        required: false,
        locales: {
            name: 'commands.moderation.timeout.option.reason.name',
            description: 'commands.moderation.timeout.option.reason.description'
        }
    })
};

@Declare({
    name: 'timeout',
    description: "Discord's native timeout — mutes a member for a set duration.",
    aliases: ['t', 'aislar'],
    botPermissions: ['ModerateMembers'],
    defaultMemberPermissions: ['ModerateMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.timeout.name', 'commands.moderation.timeout.description')

@Options(options)

export default class TimeoutCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.timeout;
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

        const reason = ctx.options.reason ?? shared.defaultReason.get();

        try {
            await target.timeout(ctx.options.minutes * 60_000, reason);
        } catch {
            return await ctx.write({ content: t.failed.get() });
        }

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Yellow).setDescription(t.done(targetId, ctx.options.minutes, reason).get())
        ] });
    }
}

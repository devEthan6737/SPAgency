import { Command, createIntegerOption, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

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
    /** guildId-userId -> pending unban timer. In-memory only — lost on restart. */
    private static pendingUnbans = new Map<string, NodeJS.Timeout>();

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
        const durationMs = ctx.options.minutes * 60_000;

        await ctx.options.member.write({ content: shared.dm(guild.name, reason).get() }).catch(() => {});
        await guild.bans.create(targetId, { reason });

        const key = `${guild.id}-${targetId}`;
        const existing = TempbanCommand.pendingUnbans.get(key);
        if (existing) clearTimeout(existing);

        TempbanCommand.pendingUnbans.set(
            key,
            setTimeout(() => {
                TempbanCommand.pendingUnbans.delete(key);
                guild.bans.remove(targetId, t.autoUnbanReason.get()).catch(() => {});
            }, durationMs)
        );

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(t.done(targetId, ctx.options.minutes, reason).get())
        ] });
    }
}

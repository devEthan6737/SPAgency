import { Command, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to kick.',
        required: true,
        locales: {
            name: 'commands.moderation.kick.option.member.name',
            description: 'commands.moderation.kick.option.member.description'
        }
    }),
    reason: createStringOption({
        description: 'Kick reason.',
        required: false,
        locales: {
            name: 'commands.moderation.kick.option.reason.name',
            description: 'commands.moderation.kick.option.reason.description'
        }
    })
};

@Declare({
    name: 'kick',
    description: 'Kicks a member from your server.',
    botPermissions: ['KickMembers'],
    defaultMemberPermissions: ['KickMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.kick.name', 'commands.moderation.kick.description')

@Options(options)

export default class KickCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.kick;
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
        await target.write({ content: shared.dm(guild.name, reason).get() }).catch(() => {});
        await guild.members.kick(targetId, reason);

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Orange).setDescription(t.done(targetId, reason).get())
        ] });
    }
}

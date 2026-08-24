import { Command, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to ban.',
        required: true,
        locales: {
            name: 'commands.moderation.ban.option.member.name',
            description: 'commands.moderation.ban.option.member.description'
        }
    }),
    reason: createStringOption({
        description: 'Ban reason.',
        required: false,
        locales: {
            name: 'commands.moderation.ban.option.reason.name',
            description: 'commands.moderation.ban.option.reason.description'
        }
    })
};

@Declare({
    name: 'ban',
    description: 'Bans a member from your server.',
    aliases: ['martillo'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.ban.name', 'commands.moderation.ban.description')

@Options(options)

export default class BanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.ban;
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
        await ctx.options.member.write({ content: shared.dm(guild.name, reason).get() }).catch(() => {});
        await guild.bans.create(targetId, { reason });

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(t.done(targetId, reason).get())
        ] });
    }
}

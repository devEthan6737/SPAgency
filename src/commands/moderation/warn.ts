import { Command, createStringOption, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { WarnRepository } from '../../database/repositories/warn.repository.js';

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

        await WarnRepository.create(ctx.guildId, targetId, ctx.author.id, ctx.options.reason);
        const total = await WarnRepository.list(ctx.guildId, targetId);

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Yellow).setDescription(t.done(targetId, total.length, ctx.options.reason).get())
        ] });
    }
}

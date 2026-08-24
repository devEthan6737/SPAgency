import { Command, createUserOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { WarnRepository } from '../../database/repositories/warn.repository.js';

const options = {
    member: createUserOption({
        description: "Member to check warnings for.",
        required: true,
        locales: {
            name: 'commands.moderation.warns.option.member.name',
            description: 'commands.moderation.warns.option.member.description'
        }
    })
};

@Declare({
    name: 'warns',
    description: "Lists a member's warnings.",
    aliases: ['warn-list', 'avisos', 'warnlist'],
    defaultMemberPermissions: ['ManageMessages'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.warns.name', 'commands.moderation.warns.description')

@Options(options)

export default class WarnsCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        
        const t = ctx.t.commands.moderation.warns;
        const targetId = ctx.options.member.id;

        const list = await WarnRepository.list(ctx.guildId, targetId);
        if (!list.length) {
            await ctx.write({ content: t.none.get() });
            return;
        }

        const embed = new Embed()
            .setColor(EmbedColors.Blue)
            .setDescription(
                t.intro(targetId, list.length).get() +
                    '\n\n' +
                    list.map((warn) => t.entry(warn.id, warn.reason, warn.moderatorId).get()).join('\n')
            );
        await ctx.write({ embeds: [embed] });
    }
}

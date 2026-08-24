import { createStringOption, createUserOption, Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to edit.',
        required: true,
        locales: {
            name: 'commands.configuration.member.setNickname.option.member.name',
            description: 'commands.configuration.member.setNickname.option.member.description'
        }
    }),
    nickname: createStringOption({
        description: 'New nickname.',
        required: true,
        locales: {
            name: 'commands.configuration.member.setNickname.option.nickname.name',
            description: 'commands.configuration.member.setNickname.option.nickname.description'
        }
    })
};

@Declare({
    name: 'set-nickname',
    description: "Changes a member's nickname.",
    botPermissions: ['ManageNicknames'],
    defaultMemberPermissions: ['ManageNicknames']
})

@LocalesT('commands.configuration.member.setNickname.name', 'commands.configuration.member.setNickname.description')

@Options(options)

export default class SetNicknameSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();

        if (ctx.options.member.id !== ctx.member.id && ctx.member.id !== guild.ownerId) {
            const highest = await ctx.member.roles.highest();
            const target = await guild.members.fetch(ctx.options.member.id);
            const targetHighest = await target.roles.highest();
            if ((highest?.position ?? 0) <= (targetHighest?.position ?? 0)) {
                await ctx.write({ content: ctx.t.commands.configuration.member.role.hierarchyError.get() });
                return;
            }
        }

        await guild.members.edit(ctx.options.member.id, { nick: ctx.options.nickname });
        await ctx.write({ content: ctx.t.commands.configuration.member.setNickname.done.get() });
    }
}

import { createRoleOption, createUserOption, Declare, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';

const options = {
    member: createUserOption({
        description: 'Member to edit.',
        required: true,
        locales: {
            name: 'commands.configuration.member.role.option.member.name',
            description: 'commands.configuration.member.role.option.member.description'
        }
    }),
    role: createRoleOption({
        description: 'Role to add/remove.',
        required: true,
        locales: {
            name: 'commands.configuration.member.role.option.role.name',
            description: 'commands.configuration.member.role.option.role.description'
        }
    })
};

@Declare({
    name: 'add-role',
    description: 'Adds a role to a member.',
    botPermissions: ['ManageRoles'],
    defaultMemberPermissions: ['ManageRoles']
})

@LocalesT('commands.configuration.member.addRole.name', 'commands.configuration.member.addRole.description')

@Options(options)

export default class AddRoleSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();

        if (ctx.member.id !== guild.ownerId) {
            const highest = await ctx.member.roles.highest();
            if ((highest?.position ?? 0) <= ctx.options.role.position) {
                await ctx.write({ content: ctx.t.commands.configuration.member.role.hierarchyError.get() });
                return;
            }
        }

        await guild.members.addRole(ctx.options.member.id, ctx.options.role.id);
        await ctx.write({ content: ctx.t.commands.configuration.member.addRole.done.get() });
    }
}

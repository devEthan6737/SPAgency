import { Command, createRoleOption, Declare, LocalesT, Options, OverwriteType, type CommandContext } from 'seyfert';

const options = {
    role: createRoleOption({
        description: 'Role to lock. Defaults to @everyone.',
        required: false,
        locales: {
            name: 'commands.moderation.lock.option.role.name',
            description: 'commands.moderation.lock.option.role.description'
        }
    })
};

@Declare({
    name: 'lock',
    description: 'Locks the channel so only staff can send messages.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.lock.name', 'commands.moderation.lock.description')

@Options(options)

export default class LockCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();
        const channel = await ctx.channel();
        if (!('permissionOverwrites' in channel)) return;

        const roleId = ctx.options.role?.id ?? guild.id;
        await channel.permissionOverwrites.edit(roleId, { type: OverwriteType.Role, deny: ['SendMessages'] });

        await ctx.write({ content: ctx.t.commands.moderation.lock.done.get() });
    }
}

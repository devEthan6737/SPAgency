import { Command, createRoleOption, Declare, LocalesT, Options, OverwriteType, type CommandContext } from 'seyfert';

const options = {
    role: createRoleOption({
        description: 'Role to unlock. Defaults to @everyone.',
        required: false,
        locales: {
            name: 'commands.moderation.unlock.option.role.name',
            description: 'commands.moderation.unlock.option.role.description'
        }
    })
};

@Declare({
    name: 'unlock',
    description: 'Unlocks the channel, letting the role send messages again.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.unlock.name', 'commands.moderation.unlock.description')

@Options(options)

export default class UnlockCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();
        const channel = await ctx.channel();
        if (!('permissionOverwrites' in channel)) return;

        const roleId = ctx.options.role?.id ?? guild.id;
        await channel.permissionOverwrites.edit(roleId, { type: OverwriteType.Role, allow: ['SendMessages'] });

        await ctx.write({ content: ctx.t.commands.moderation.unlock.done.get() });
    }
}

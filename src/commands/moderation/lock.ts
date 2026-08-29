import { Command, createRoleOption, Declare, EmbedColors, LocalesT, Options, OverwriteType, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

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

        void dispatchLog(ctx.client, LockCommand.log({ guildId: guild.id, roleId, executorId: ctx.author.id, channelId: channel.id })).catch(() => {});
        await ctx.write({ content: ctx.t.commands.moderation.lock.done.get() });
    }

    private static log({ guildId, roleId, executorId, channelId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Lock,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.lock(roleId, channelId).get(),
            targetId: roleId,
            executorId,
            data: { channelId }
        });
    }
}

interface LogInput {
    guildId: string;
    roleId: string;
    executorId: string;
    channelId: string;
}

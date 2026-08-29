import { Command, createRoleOption, Declare, EmbedColors, LocalesT, Options, OverwriteType, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

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

        void dispatchLog(ctx.client, UnlockCommand.log({ guildId: guild.id, roleId, executorId: ctx.author.id, channelId: channel.id })).catch(() => {});

        await ctx.write({ content: ctx.t.commands.moderation.unlock.done.get() });
    }

    private static log({ guildId, roleId, executorId, channelId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Unlock,
            color: EmbedColors.Green,
            describe: (t) => t.systems.logs.actions.unlock(roleId, channelId).get(),
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

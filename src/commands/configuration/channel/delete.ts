import { createChannelOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    channel: createChannelOption({
        description: 'Channel to delete.',
        required: true,
        locales: {
            name: 'commands.configuration.channel.delete.option.channel.name',
            description: 'commands.configuration.channel.delete.option.channel.description'
        }
    })
};

@Declare({
    name: 'delete',
    description: 'Deletes a channel.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels']
})

@LocalesT('commands.configuration.channel.delete.name', 'commands.configuration.channel.delete.description')

@Options(options)

export default class DeleteSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const guild = await ctx.guild();
        const channelId = ctx.options.channel.id;
        await guild.channels.delete(channelId);
        
        void dispatchLog(ctx.client, DeleteSubCommand.log({ guildId: guild.id, channelId, executorId: ctx.author.id })).catch(() => {});
        await ctx.write({ content: ctx.t.commands.configuration.channel.deleted.get() });
    }

    private static log({ guildId, channelId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.ChannelDelete,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.channelDelete(channelId).get(),
            targetId: channelId,
            executorId
        });
    }
}

interface LogInput {
    guildId: string;
    channelId: string;
    executorId: string;
}

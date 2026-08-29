import { ChannelType, createStringOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    name: createStringOption({
        description: 'Name for the new channel.',
        required: true,
        locales: {
            name: 'commands.configuration.channel.create.option.name.name',
            description: 'commands.configuration.channel.create.option.name.description'
        }
    })
};

@Declare({
    name: 'create',
    description: 'Creates a new text channel.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels']
})

@LocalesT('commands.configuration.channel.create.name', 'commands.configuration.channel.create.description')

@Options(options)

export default class CreateSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const guild = await ctx.guild();
        const channel = await guild.channels.create({ name: ctx.options.name, type: ChannelType.GuildText });
        
        void dispatchLog(ctx.client, CreateSubCommand.log({ guildId: guild.id, channelId: channel.id, executorId: ctx.author.id })).catch(() => {});
        await ctx.write({ content: ctx.t.commands.configuration.channel.created.get() });
    }

    private static log({ guildId, channelId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.ChannelCreate,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.channelCreate(channelId).get(),
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

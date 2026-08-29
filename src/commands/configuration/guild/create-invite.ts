import { ChannelType, Declare, EmbedColors, LocalesT, SubCommand, type CommandContext, type TextGuildChannelStructure } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

@Declare({
    name: 'create-invite',
    description: 'Creates an invite for a random text channel.',
    botPermissions: ['CreateInstantInvite'],
    defaultMemberPermissions: ['CreateInstantInvite']
})

@LocalesT('commands.configuration.guild.createInvite.name', 'commands.configuration.guild.createInvite.description')

export default class CreateInviteSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.guild.createInvite;

        const guild = await ctx.guild();
        const channels = await guild.channels.list();
        const textChannels = channels.filter((channel): channel is TextGuildChannelStructure => channel.type === ChannelType.GuildText);
        const channel = textChannels[Math.floor(Math.random() * textChannels.length)];

        if (!channel) return await ctx.write({ content: t.noChannel.get() });

        const invite = await channel.invites.create({ max_age: 86_400 });
        
        void dispatchLog(ctx.client, CreateInviteSubCommand.log({ guildId: guild.id, channelId: channel.id, executorId: ctx.author.id, code: invite.code })).catch(() => {});
        await ctx.write({ content: t.done(`https://discord.gg/${invite.code}`).get() });
    }

    private static log({ guildId, channelId, executorId, code }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.CreateInvite,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.createInvite(channelId, code).get(),
            targetId: channelId,
            executorId,
            data: { code }
        });
    }
}

interface LogInput {
    guildId: string;
    channelId: string;
    executorId: string;
    code: string;
}

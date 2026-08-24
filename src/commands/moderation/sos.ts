import { ChannelType, Command, Declare, LocalesT, type CommandContext, type TextGuildChannelStructure } from 'seyfert';
import { GuildRepository } from '../../database/repositories/guild.repository.js';

@Declare({
    name: 'sos',
    description: "Pings @everyone in the log channel with a fresh invite, for emergencies.",
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.sos.name', 'commands.moderation.sos.description')

export default class SosCommand extends Command {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.sos;

        const settings = await GuildRepository.getLogSettings(ctx.guildId);
        const logChannel = settings?.logsChannel ? await ctx.client.channels.fetch(settings.logsChannel).catch(() => undefined) : undefined;

        if (!logChannel || !('messages' in logChannel)) {
            return await ctx.write({ content: t.noLogChannel.get() });
        }

        const guild = await ctx.guild();
        const channels = await guild.channels.list();
        const textChannels = channels.filter((channel): channel is TextGuildChannelStructure => channel.type === ChannelType.GuildText);
        const inviteChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
        if (!inviteChannel) return await ctx.write({ content: t.noChannel.get() });

        const invite = await inviteChannel.invites.create({ max_age: 86_400 });

        await logChannel.messages.write({
            content: t.alert(`https://discord.gg/${invite.code}`).get(),
            allowed_mentions: { parse: ['everyone'] }
        });

        await ctx.write({ content: t.done.get() });
    }
}

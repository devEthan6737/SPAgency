import { ChannelType, Command, Declare, LocalesT, type CommandContext, type TextGuildChannelStructure } from 'seyfert';

@Declare({
    name: 'sos',
    description: 'Pings SPAgency staff with a fresh invite to this server, for emergencies.',
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.sos.name', 'commands.moderation.sos.description')

export default class SosCommand extends Command {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.sos;

        const staffChannelId = process.env.STAFF_LOGS_CHANNEL;
        const staffChannel = staffChannelId ? await ctx.client.channels.fetch(staffChannelId).catch(() => undefined) : undefined;

        if (!staffChannel || !('messages' in staffChannel)) return await ctx.write({ content: t.noStaffChannel.get() });

        const guild = await ctx.guild();
        const channels = await guild.channels.list();
        const textChannels = channels.filter((channel): channel is TextGuildChannelStructure => channel.type === ChannelType.GuildText);
        const inviteChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
        if (!inviteChannel) return await ctx.write({ content: t.noChannel.get() });

        const invite = await inviteChannel.invites.create({ max_age: 86_400 });

        await staffChannel.messages.write({
            content: t.alert(guild.name, guild.id, `https://discord.gg/${invite.code}`).get(),
            allowed_mentions: { parse: ['everyone'] }
        });

        await ctx.write({ content: t.done.get() });
    }
}

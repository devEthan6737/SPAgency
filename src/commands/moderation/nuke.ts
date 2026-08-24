import { ChannelType, Command, Declare, LocalesT, type CommandContext } from 'seyfert';
import { Confirmation } from '../../systems/confirmation/index.js';

@Declare({
    name: 'nuke',
    description: 'Deletes and recreates this channel, wiping all its messages.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.nuke.name', 'commands.moderation.nuke.description')

export default class NukeCommand extends Command {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.nuke;

        const channel = await ctx.channel();
        if (channel.type !== ChannelType.GuildText) {
            await ctx.write({ content: t.notText.get() });
            return;
        }

        const confirmed = await Confirmation.ask(ctx, {
            description: t.confirm.get(),
            confirmLabel: t.confirmLabel.get(),
            cancelLabel: t.cancelLabel.get()
        });
        if (!confirmed) return;

        const guild = await ctx.guild();
        const raw = await ctx.client.channels.raw(channel.id);
        if (raw.type !== ChannelType.GuildText) return;

        const clone = await guild.channels.create({
            type: ChannelType.GuildText,
            name: raw.name,
            parent_id: raw.parent_id,
            position: raw.position,
            topic: raw.topic,
            nsfw: raw.nsfw,
            rate_limit_per_user: raw.rate_limit_per_user,
            permission_overwrites: raw.permission_overwrites
        });

        await guild.channels.delete(channel.id);
        await clone.messages.write({ content: t.done.get() });
    }
}

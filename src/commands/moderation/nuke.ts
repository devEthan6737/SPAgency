import { ChannelType, Command, Declare, EmbedColors, LocalesT, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';
import { Confirmation } from '../../systems/confirmation/index.js';

@Declare({
    name: 'nuke',
    description: 'Deletes and recreates this channel, wiping all its messages.',
    botPermissions: ['ManageChannels'],
    defaultMemberPermissions: ['ManageChannels'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.nuke.name', 'commands.moderation.nuke.description')

/**
 * Deletes and recreates the invoking text channel with the same settings, wiping its entire
 * message history. Requires confirmation, since the channel content is unrecoverable afterward
 * (short of a full `/backup load`).
 */
export default class NukeCommand extends Command {
    /**
     * Confirms with the invoker, then clones the channel's raw settings (name, parent, position,
     * topic, nsfw, slowmode, permission overwrites) into a new channel, deletes the original, logs
     * the action, and posts a confirmation message in the clone.
     */
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

        void dispatchLog(ctx.client, NukeCommand.log({ guildId: guild.id, channelId: clone.id, executorId: ctx.author.id })).catch(() => {});
        await clone.messages.write({ content: t.done.get() });
    }

    /** Builds the `BotActionLog` entry recording the nuke, keyed on the new channel's id. */
    private static log({ guildId, channelId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Nuke,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.nuke(channelId).get(),
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

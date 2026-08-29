import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'channels',
    description: 'Deletes channels that share a name with an earlier one — undoes a raid that spammed duplicate channels.'
})

@LocalesT('commands.configuration.unnuke.channels.name', 'commands.configuration.unnuke.channels.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

export default class ChannelsSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        await ctx.write({ content: t.started.get() });

        const guild = await ctx.guild();
        const channels = await guild.channels.list();
        const removed = await UnnukeHelpers.deleteDuplicates(
            channels,
            (channel) => ('name' in channel ? channel.name : undefined),
            (channel) => guild.channels.delete(channel.id)
        );

        void dispatchLog(ctx.client, ChannelsSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

    private static log({ guildId, executorId, removed }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.UnnukeChannels,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.unnukeChannels(removed).get(),
            executorId,
            data: { removed }
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

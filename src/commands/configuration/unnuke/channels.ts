import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'channels',
    description: 'Deletes channels sharing a name with an earlier one, undoing a raid that spammed duplicates.'
})

@LocalesT('commands.configuration.unnuke.channels.name', 'commands.configuration.unnuke.channels.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

/** Deletes every guild channel that shares a name with an earlier one, to undo a raid that spammed duplicate channels. Logs the number removed via {@link BotActionLog}. */
export default class ChannelsSubCommand extends SubCommand {
    /**
     * Lists all channels, shows which ones share a name with an earlier one and asks for confirmation
     * (a duplicate may be intentional), then deletes them.
     * @param ctx The command context.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        const guild = await ctx.guild();
        const channels = await guild.channels.list();
        const duplicates = UnnukeHelpers.findDuplicates(channels, (channel) => ('name' in channel ? channel.name : undefined));

        const confirmed = await UnnukeHelpers.confirm(ctx, {
            count: duplicates.length,
            prompt: t.channels.confirm(duplicates.length, UnnukeHelpers.preview(duplicates.map(({ name }) => `#${name}`))).get()
        });
        if (!confirmed) return;

        await ctx.editOrReply({ content: t.started.get(), embeds: [], components: [] });
        const removed = await UnnukeHelpers.removeAll(
            duplicates.map(({ entry }) => entry),
            (channel) => guild.channels.delete(channel.id)
        );

        void dispatchLog(ctx.client, ChannelsSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

    /** Builds the {@link BotActionLog} entry recording how many duplicate channels were removed. */
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

/** Input for {@link ChannelsSubCommand.log}. */
interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

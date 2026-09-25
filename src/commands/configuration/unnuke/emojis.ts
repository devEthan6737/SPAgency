import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'emojis',
    description: 'Deletes emojis that share a name with an earlier one — undoes a raid that spammed duplicate emojis.'
})

@LocalesT('commands.configuration.unnuke.emojis.name', 'commands.configuration.unnuke.emojis.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

/** Deletes every guild emoji that shares a name with an earlier one, to undo a raid that spammed duplicate emojis. Logs the number removed via {@link BotActionLog}. */
export default class EmojisSubCommand extends SubCommand {
    /**
     * Lists all emojis, shows which ones share a name with an earlier one and asks for confirmation
     * (a duplicate may be intentional), then deletes them.
     * @param ctx The command context.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        const guild = await ctx.guild();
        const emojis = await guild.emojis.list();
        const duplicates = UnnukeHelpers.findDuplicates(emojis, (emoji) => emoji.name);

        const confirmed = await UnnukeHelpers.confirm(ctx, {
            count: duplicates.length,
            prompt: t.emojis.confirm(duplicates.length, UnnukeHelpers.preview(duplicates.map(({ name }) => `:${name}:`))).get()
        });
        if (!confirmed) return;

        await ctx.editOrReply({ content: t.started.get(), embeds: [], components: [] });
        const removed = await UnnukeHelpers.removeAll(
            duplicates.map(({ entry }) => entry),
            (emoji) => emoji.delete()
        );

        void dispatchLog(ctx.client, EmojisSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

    /** Builds the {@link BotActionLog} entry recording how many duplicate emojis were removed. */
    private static log({ guildId, executorId, removed }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.UnnukeEmojis,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.unnukeEmojis(removed).get(),
            executorId,
            data: { removed }
        });
    }
}

/** Input for {@link EmojisSubCommand.log}. */
interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

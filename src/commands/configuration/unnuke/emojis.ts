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

export default class EmojisSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        await ctx.write({ content: t.started.get() });

        const guild = await ctx.guild();
        const emojis = await guild.emojis.list();
        const removed = await UnnukeHelpers.deleteDuplicates(
            emojis,
            (emoji) => emoji.name,
            (emoji) => emoji.delete()
        );

        void dispatchLog(ctx.client, EmojisSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

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

interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

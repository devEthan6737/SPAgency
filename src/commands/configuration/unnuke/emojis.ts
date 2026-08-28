import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
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

        await ctx.editOrReply({ content: t.done(removed).get() });
    }
}

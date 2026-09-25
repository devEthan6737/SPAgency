import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'bans',
    description: 'Unbans every currently banned user — undoes a mass-ban raid.',
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers']
})

@LocalesT('commands.configuration.unnuke.bans.name', 'commands.configuration.unnuke.bans.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

/** Unbans every currently banned member of the guild, one by one, to undo a mass-ban raid. Logs the number removed via {@link BotActionLog}. */
export default class BansSubCommand extends SubCommand {
    /**
     * Lists all current bans and asks for confirmation, since it lifts every one and not only those
     * of a raid, then removes them and reports how many were lifted.
     * @param ctx The command context.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        const guild = await ctx.guild();
        const bans = await guild.bans.list();

        const confirmed = await UnnukeHelpers.confirm(ctx, {
            count: bans.length,
            prompt: t.bans.confirm(bans.length, UnnukeHelpers.preview(bans.map((ban) => ban.user.username))).get()
        });
        if (!confirmed) return;

        await ctx.editOrReply({ content: t.started.get(), embeds: [], components: [] });
        const removed = await UnnukeHelpers.removeAll(bans, (ban) => guild.bans.remove(ban.user.id));

        void dispatchLog(ctx.client, BansSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

    /** Builds the {@link BotActionLog} entry recording how many bans were lifted. */
    private static log({ guildId, executorId, removed }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.UnnukeBans,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.unnukeBans(removed).get(),
            executorId,
            data: { removed }
        });
    }
}

/** Input for {@link BansSubCommand.log}. */
interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

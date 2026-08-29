import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

@Declare({
    name: 'bans',
    description: 'Unbans every currently banned user — undoes a mass-ban raid.',
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers']
})

@LocalesT('commands.configuration.unnuke.bans.name', 'commands.configuration.unnuke.bans.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

export default class BansSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        await ctx.write({ content: t.started.get() });

        const guild = await ctx.guild();
        const bans = await guild.bans.list();
        for (const ban of bans) {
            await guild.bans.remove(ban.user.id).catch(() => {});
        }

        void dispatchLog(ctx.client, BansSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed: bans.length })).catch(() => {});
        await ctx.editOrReply({ content: t.done(bans.length).get() });
    }

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

interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

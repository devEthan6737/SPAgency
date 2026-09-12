import { Declare, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'roles',
    description: 'Deletes roles that share a name with an earlier one — undoes a raid that spammed duplicate roles.'
})

@LocalesT('commands.configuration.unnuke.roles.name', 'commands.configuration.unnuke.roles.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

/** Deletes every guild role that shares a name with an earlier one, to undo a raid that spammed duplicate roles. Logs the number removed via {@link BotActionLog}. */
export default class RolesSubCommand extends SubCommand {
    /** Lists all roles and delegates duplicate detection/removal to {@link UnnukeHelpers.deleteDuplicates}. */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        await ctx.write({ content: t.started.get() });

        const guild = await ctx.guild();
        const roles = await guild.roles.list();
        const removed = await UnnukeHelpers.deleteDuplicates(
            roles,
            (role) => role.name,
            (role) => guild.roles.delete(role.id)
        );

        void dispatchLog(ctx.client, RolesSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, removed })).catch(() => {});
        await ctx.editOrReply({ content: t.done(removed).get() });
    }

    /** Builds the {@link BotActionLog} entry recording how many duplicate roles were removed. */
    private static log({ guildId, executorId, removed }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.UnnukeRoles,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.unnukeRoles(removed).get(),
            executorId,
            data: { removed }
        });
    }
}

/** Input for {@link RolesSubCommand.log}. */
interface LogInput {
    guildId: string;
    executorId: string;
    removed: number;
}

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
    /**
     * Lists all roles, shows which ones share a name with an earlier one and asks for confirmation
     * (a duplicate may be intentional), then deletes them.
     * @param ctx The command context.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.configuration.unnuke;
        const guild = await ctx.guild();
        const roles = await guild.roles.list();
        const duplicates = UnnukeHelpers.findDuplicates(roles, (role) => role.name);

        const confirmed = await UnnukeHelpers.confirm(ctx, {
            count: duplicates.length,
            prompt: t.roles.confirm(duplicates.length, UnnukeHelpers.preview(duplicates.map(({ name }) => `@${name}`))).get()
        });
        if (!confirmed) return;

        await ctx.editOrReply({ content: t.started.get(), embeds: [], components: [] });
        const removed = await UnnukeHelpers.removeAll(
            duplicates.map(({ entry }) => entry),
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

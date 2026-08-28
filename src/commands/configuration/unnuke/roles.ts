import { Declare, LocalesT, SubCommand, type CommandContext } from 'seyfert';
import { Cooldown } from '@slipher/cooldown';
import { UnnukeHelpers } from './shared.js';

@Declare({
    name: 'roles',
    description: 'Deletes roles that share a name with an earlier one — undoes a raid that spammed duplicate roles.'
})

@LocalesT('commands.configuration.unnuke.roles.name', 'commands.configuration.unnuke.roles.description')

@Cooldown.user(15 * 60_000, { group: 'unnuke' })

export default class RolesSubCommand extends SubCommand {
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

        await ctx.editOrReply({ content: t.done(removed).get() });
    }
}

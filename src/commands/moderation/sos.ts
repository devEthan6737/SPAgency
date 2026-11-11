import { Cooldown } from '@slipher/cooldown';
import { Command, Declare, LocalesT, type CommandContext } from 'seyfert';
import { IntelligentSosSystem } from '../../systems/intelligent-sos/index.js';

@Declare({
    name: 'sos',
    description: 'Pings SPAgency staff with a fresh invite to this server, for emergencies.',
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.sos.name', 'commands.moderation.sos.description')

@Cooldown.guild(5 * 60_000)

/**
 * Pings SPAgency staff with a fresh invite to this server, for emergencies.
 * Manual counterpart to {@link IntelligentSosSystem.trigger}. Unlike the automatic path, it has no
 * `intelligentSosEnable` gate, since an admin invoking it is already a deliberate signal. It is limited
 * to once per 5 minutes per server, since each use pings the whole staff with `@everyone`.
 */
export default class SosCommand extends Command {
    /**
     * Delegates to {@link IntelligentSosSystem.sendAlert} and reports which of its
     * discriminated results occurred: sent, no staff channel configured, or no channel to invite from.
     */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.sos;

        const result = await IntelligentSosSystem.sendAlert(ctx.client, ctx.guildId);
        if (result !== 'sent') ctx.cooldown.reset();
        if (result === 'noStaffChannel') return await ctx.write({ content: t.noStaffChannel.get() });
        if (result === 'noInviteChannel') return await ctx.write({ content: t.noChannel.get() });

        await ctx.write({ content: t.done.get() });
    }
}

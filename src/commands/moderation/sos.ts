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

export default class SosCommand extends Command {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.sos;

        const result = await IntelligentSosSystem.sendAlert(ctx.client, ctx.guildId);
        if (result === 'noStaffChannel') return await ctx.write({ content: t.noStaffChannel.get() });
        if (result === 'noInviteChannel') return await ctx.write({ content: t.noChannel.get() });

        await ctx.write({ content: t.done.get() });
    }
}

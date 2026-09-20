import { ComponentCommand, type ComponentContext } from 'seyfert';
import { SupportClose, SupportConfig, SupportPosts, SupportTicketIndex } from '../systems/support/index.js';

/**
 * The **Close ticket** button on a ticket's opening message — the only way to close a ticket from
 * Discord, there is no command. Only the staff role can use it. The `customId` carries no ticket:
 * the click is resolved by the channel it happens in, so the button keeps working across restarts.
 */
export default class SupportCloseButton extends ComponentCommand {
    componentType = 'Button' as const;
    customId = SupportPosts.CloseButtonId;

    /**
     * Checks that the click is a staff member's, in a ticket channel, then starts the close and answers privately.
     * @param ctx The button interaction.
     */
    async run(ctx: ComponentContext<'Button'>) {
        const t = ctx.t.systems.support.close.button;
        await ctx.deferReply(true);

        const settings = SupportConfig.get();
        if (!ctx.inGuild() || !settings || ctx.guildId !== settings.guildId) return await ctx.editOrReply({ content: t.notTicket.get() });
        if (!ctx.member.roles.keys.includes(settings.staffRoleId)) return await ctx.editOrReply({ content: t.notStaff.get() });

        const ticket = SupportTicketIndex.getByChannel(ctx.channelId);
        if (!ticket) return await ctx.editOrReply({ content: t.notTicket.get() });

        const result = await SupportClose.begin(ctx.client, settings, { ticket, closedBy: 'staff', staffId: ctx.author.id });
        if (result === 'failed') return await ctx.editOrReply({ content: t.failed.get() });

        await ctx.editOrReply({ content: (result === 'already' ? t.already : t.started).get() });
    }
}

import {
    ActionRow,
    Button,
    ButtonStyle,
    Embed,
    EmbedColors,
    type ButtonInteraction,
    type CommandContext
} from 'seyfert';

export interface ConfirmationOptions {
    /** Prompt shown while waiting for a click. */
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    /** Milliseconds to wait for a click before treating it as cancelled. Default 15s. */
    timeoutMs?: number;
}

/**
 * Shared "are you sure?" prompt for destructive actions — sends an embed with
 * confirm/cancel buttons and resolves once the invoker clicks one (or it times out).
 */
export class Confirmation {
    static async ask(ctx: CommandContext, options: ConfirmationOptions): Promise<boolean> {
        const timeoutMs = options.timeoutMs ?? 15_000;
        const confirmId = `confirm-${ctx.author.id}-${Date.now()}`;
        const cancelId = `cancel-${ctx.author.id}-${Date.now()}`;

        const embed = new Embed().setColor(EmbedColors.Yellow).setDescription(options.description);
        const row = (disabled: boolean) =>
            new ActionRow<Button>().addComponents(
                new Button().setCustomId(confirmId).setLabel(options.confirmLabel).setStyle(ButtonStyle.Danger).setDisabled(disabled),
                new Button().setCustomId(cancelId).setLabel(options.cancelLabel).setStyle(ButtonStyle.Secondary).setDisabled(disabled)
            );

        const message = await ctx.write({ embeds: [embed], components: [row(false)] }, true);
        const collector = message.createComponentCollector({
            filter: (interaction) => interaction.user.id === ctx.author.id
        });
        const interaction = await collector.waitFor<ButtonInteraction>([confirmId, cancelId], timeoutMs);

        if (!interaction) {
            await ctx.editOrReply({ embeds: [embed], components: [row(true)] });
            return false;
        }

        await interaction.update({ embeds: [embed], components: [row(true)] });
        return interaction.customId === confirmId;
    }
}

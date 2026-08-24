import { Declare, Embed, EmbedColors, LocalesT, SubCommand, type CommandContext } from 'seyfert';

@Declare({
    name: 'info',
    description: 'Shows information about the server.'
})

@LocalesT('commands.configuration.guild.info.name', 'commands.configuration.guild.info.description')

export default class InfoSubCommand extends SubCommand {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;
        
        const t = ctx.t.commands.configuration.guild.info;
        const guild = await ctx.guild();

        const embed = new Embed()
            .setColor(EmbedColors.Blue)
            .setAuthor({ name: guild.name, iconUrl: guild.iconURL() })
            .addFields(
                { name: t.id.get(), value: guild.id, inline: true },
                { name: t.owner.get(), value: `<@${guild.ownerId}>`, inline: true },
                { name: t.createdAt.get(), value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
                { name: t.verificationLevel.get(), value: `${guild.verificationLevel}`, inline: true },
                { name: t.boosts.get(), value: `${guild.premiumSubscriptionCount ?? 0} (Tier ${guild.premiumTier})`, inline: true }
            );

        await ctx.write({ embeds: [embed] });
    }
}

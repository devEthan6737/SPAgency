import { Command, Declare, Embed, EmbedColors, LocalesT, type CommandContext } from 'seyfert';
import { getUbfb } from '../../systems/ubfb/client.js';

@Declare({
    name: 'detect',
    description: 'Scans your server members against the UBFB blacklist.',
    aliases: ['detectar'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.detect.name', 'commands.moderation.detect.description')

export default class DetectCommand extends Command {
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.detect;
        const guild = await ctx.guild();
        const ubfb = getUbfb();

        await ctx.write({ content: t.scanning.get() });

        const matches: string[] = [];
        let after: string | undefined;

        while (true) {
            const page = await guild.members.list({ limit: 1000, after });
            for (const member of page) {
                if (ubfb.isBlacklisted(member.id)) {
                    const entry = ubfb.getCachedEntry(member.id);
                    matches.push(entry ? t.entry(member.id, entry.reason).get() : t.entryUnknownReason(member.id).get());
                }
            }

            if (page.length < 1000) break;
            after = page[page.length - 1]?.id;
            if (!after) break;
        }

        if (!matches.length) return await ctx.editOrReply({ content: t.noneFound.get() });

        await ctx.editOrReply({ content: t.found(matches.length, guild.name).get(), embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(matches.map((line, i) => `**${i + 1}.** ${line}`).join('\n').slice(0, 4096))
        ] });
    }
}

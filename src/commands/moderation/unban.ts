import { Command, createStringOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

const options = {
    id: createStringOption({
        description: 'ID of the user to unban.',
        required: true,
        locales: {
            name: 'commands.moderation.unban.option.id.name',
            description: 'commands.moderation.unban.option.id.description'
        }
    })
};

@Declare({
    name: 'unban',
    description: 'Unbans a user from your server.',
    aliases: ['desbanear'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.unban.name', 'commands.moderation.unban.description')

@Options(options)

export default class UnbanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.unban;
        const guild = await ctx.guild();
        const userId = ctx.options.id;

        if (!/^\d{17,20}$/.test(userId)) return await ctx.write({ content: t.invalidId.get() });

        try {
            await guild.bans.remove(userId);
        } catch {
            return await ctx.write({ content: t.notBanned.get() });
        }
        
        void dispatchLog(ctx.client, UnbanCommand.log({ guildId: guild.id, targetId: userId, executorId: ctx.author.id })).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Green).setDescription(t.done(userId).get())
        ] });
    }

    private static log({ guildId, targetId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Unban,
            color: EmbedColors.Green,
            describe: (t) => t.systems.logs.actions.unban(targetId).get(),
            targetId,
            executorId
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
}

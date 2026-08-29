import { Command, createStringOption, Declare, Embed, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';

const options = {
    id: createStringOption({
        description: "ID of the user to ban — doesn't need to be a member of this server.",
        required: true,
        locales: {
            name: 'commands.moderation.hackban.option.id.name',
            description: 'commands.moderation.hackban.option.id.description'
        }
    }),
    reason: createStringOption({
        description: 'Ban reason.',
        required: false,
        locales: {
            name: 'commands.moderation.hackban.option.reason.name',
            description: 'commands.moderation.hackban.option.reason.description'
        }
    })
};

@Declare({
    name: 'hackban',
    description: "Bans a user who isn't a member of your server, by id.",
    aliases: ['banid'],
    botPermissions: ['BanMembers'],
    defaultMemberPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.hackban.name', 'commands.moderation.hackban.description')

@Options(options)

export default class HackbanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.moderation.hackban;
        const guild = await ctx.guild();
        const userId = ctx.options.id;

        if (!/^\d{17,20}$/.test(userId)) return await ctx.write({ content: t.invalidId.get() });
        if (userId === ctx.client.botId || userId === ctx.author.id) return await ctx.write({ content: ctx.t.commands.moderation.shared.cannotTargetSelf.get() });

        const reason = ctx.options.reason ?? ctx.t.commands.moderation.shared.defaultReason.get();

        try {
            await guild.bans.create(userId, { reason });
        } catch {
            return await ctx.write({ content: t.failed.get() });
        }
        void dispatchLog(ctx.client, HackbanCommand.log({ guildId: guild.id, targetId: userId, executorId: ctx.author.id, reason })).catch(() => {});

        await ctx.write({ embeds: [
            new Embed().setColor(EmbedColors.Red).setDescription(t.done(userId, reason).get())
        ] });
    }

    private static log({ guildId, targetId, executorId, reason }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Hackban,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.hackban(targetId, reason).get(),
            targetId,
            executorId,
            reason
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    reason: string;
}

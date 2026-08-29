import { Command, createStringOption, Declare, EmbedColors, LocalesT, Options, type CommandContext } from 'seyfert';
import { BlacklistReason } from 'ubfb';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { Confirmation } from '../../systems/confirmation/index.js';
import { BotActionLog, dispatchLog } from '../../systems/logs/index.js';
import { getUbfb } from '../../systems/ubfb/client.js';

const options = {
    reason: createStringOption({
        description: 'Only ban blacklist entries with this reason. Defaults to everyone on the blacklist.',
        required: false,
        choices: Object.values(BlacklistReason).map((reason) => ({ name: reason, value: reason })),
        locales: {
            name: 'commands.moderation.forceban.option.reason.name',
            description: 'commands.moderation.forceban.option.reason.description'
        }
    })
};

@Declare({
    name: 'forceban',
    description: 'Bans every UBFB blacklist entry from your server, member or not.',
    defaultMemberPermissions: ['Administrator'],
    botPermissions: ['BanMembers'],
    props: { category: 'moderation' }
})

@LocalesT('commands.moderation.forceban.name', 'commands.moderation.forceban.description')

@Options(options)

export default class ForcebanCommand extends Command {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.moderation.forceban;
        const entries = (await getUbfb().getAllBlacklist()).filter((entry) => !ctx.options.reason || entry.reason === ctx.options.reason);

        if (!entries.length) {
            await ctx.write({ content: t.noneMatching.get() });
            return;
        }

        const confirmed = await Confirmation.ask(ctx, {
            description: t.confirm(entries.length).get(),
            confirmLabel: t.confirmLabel.get(),
            cancelLabel: t.cancelLabel.get()
        });
        if (!confirmed) return;

        const guild = await ctx.guild();
        let banned = 0;

        for (const entry of entries) {
            const ok = await guild.bans.create(entry.id, { reason: entry.reason }).then(
                () => true,
                () => false
            );
            if (ok) banned++;
        }

        void dispatchLog(ctx.client, ForcebanCommand.log({ guildId: guild.id, executorId: ctx.author.id, banned, total: entries.length })).catch(() => {});
        await ctx.editOrReply({ content: t.done(banned, entries.length).get() });
    }

    private static log({ guildId, executorId, banned, total }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.Forceban,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.actions.forceban(banned, total).get(),
            executorId,
            data: { banned, total }
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
    banned: number;
    total: number;
}

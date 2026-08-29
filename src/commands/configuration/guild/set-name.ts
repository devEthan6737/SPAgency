import { createStringOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    name: createStringOption({
        description: 'New server name.',
        required: true,
        locales: {
            name: 'commands.configuration.guild.setName.option.name.name',
            description: 'commands.configuration.guild.setName.option.name.description'
        }
    })
};

@Declare({
    name: 'set-name',
    description: "Changes the server's name.",
    botPermissions: ['ManageGuild'],
    defaultMemberPermissions: ['ManageGuild']
})

@LocalesT('commands.configuration.guild.setName.name', 'commands.configuration.guild.setName.description')

@Options(options)

export default class SetNameSubCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;

        const guild = await ctx.guild();
        await guild.edit({ name: ctx.options.name });
        
        void dispatchLog(ctx.client, SetNameSubCommand.log({ guildId: guild.id, executorId: ctx.author.id, name: ctx.options.name })).catch(() => {});
        await ctx.write({ content: ctx.t.commands.configuration.guild.setName.done.get() });
    }

    private static log({ guildId, executorId, name }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.SetName,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.setName(name).get(),
            executorId,
            data: { name }
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
    name: string;
}

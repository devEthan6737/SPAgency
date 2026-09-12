import { createStringOption, createUserOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    member: createUserOption({
        description: 'Member to edit.',
        required: true,
        locales: {
            name: 'commands.configuration.member.setNickname.option.member.name',
            description: 'commands.configuration.member.setNickname.option.member.description'
        }
    }),
    nickname: createStringOption({
        description: 'New nickname.',
        required: true,
        locales: {
            name: 'commands.configuration.member.setNickname.option.nickname.name',
            description: 'commands.configuration.member.setNickname.option.nickname.description'
        }
    })
};

@Declare({
    name: 'set-nickname',
    description: "Changes a member's nickname.",
    botPermissions: ['ManageNicknames'],
    defaultMemberPermissions: ['ManageNicknames']
})

@LocalesT('commands.configuration.member.setNickname.name', 'commands.configuration.member.setNickname.description')

@Options(options)

/**
 * Changes a member's nickname. Requires `ManageNicknames`.
 * A member can always set their own nickname; changing someone else's requires the invoker to be
 * the server owner or to outrank the target's highest role.
 */
export default class SetNicknameSubCommand extends SubCommand {
    /** Checks the invoker/target role hierarchy (skipped for self-edits), then applies the nickname and logs the action. */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();

        if (ctx.options.member.id !== ctx.member.id && ctx.member.id !== guild.ownerId) {
            const highest = await ctx.member.roles.highest();
            const target = await guild.members.fetch(ctx.options.member.id);
            const targetHighest = await target.roles.highest();
            if ((highest?.position ?? 0) <= (targetHighest?.position ?? 0)) {
                await ctx.write({ content: ctx.t.commands.configuration.member.role.hierarchyError.get() });
                return;
            }
        }

        await guild.members.edit(ctx.options.member.id, { nick: ctx.options.nickname });
        
        void dispatchLog(
            ctx.client,
            SetNicknameSubCommand.log({
                guildId: guild.id,
                targetId: ctx.options.member.id,
                executorId: ctx.author.id,
                nickname: ctx.options.nickname
            })
        ).catch(() => {});
        
        await ctx.write({ content: ctx.t.commands.configuration.member.setNickname.done.get() });
    }

    /** Builds the {@link BotActionLog} entry recording the nickname change. */
    private static log({ guildId, targetId, executorId, nickname }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.SetNickname,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.setNickname(targetId, nickname).get(),
            targetId,
            executorId,
            data: { nickname }
        });
    }
}

/** Input for {@link SetNicknameSubCommand.log}. */
interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    nickname: string;
}

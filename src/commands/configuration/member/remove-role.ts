import { createRoleOption, createUserOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    member: createUserOption({
        description: 'Member to edit.',
        required: true,
        locales: {
            name: 'commands.configuration.member.role.option.member.name',
            description: 'commands.configuration.member.role.option.member.description'
        }
    }),
    role: createRoleOption({
        description: 'Role to add/remove.',
        required: true,
        locales: {
            name: 'commands.configuration.member.role.option.role.name',
            description: 'commands.configuration.member.role.option.role.description'
        }
    })
};

@Declare({
    name: 'remove-role',
    description: 'Removes a role from a member.',
    botPermissions: ['ManageRoles'],
    defaultMemberPermissions: ['ManageRoles']
})

@LocalesT('commands.configuration.member.removeRole.name', 'commands.configuration.member.removeRole.description')

@Options(options)

/**
 * Removes a role from a member. Requires `ManageRoles`.
 * Unless the invoker is the server owner, the role must sit below the invoker's highest role.
 */
export default class RemoveRoleSubCommand extends SubCommand {
    /** Checks the invoker's role hierarchy against the target role, then removes it and logs the action. */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const guild = await ctx.guild();

        if (ctx.member.id !== guild.ownerId) {
            const highest = await ctx.member.roles.highest();
            if ((highest?.position ?? 0) <= ctx.options.role.position) {
                await ctx.write({ content: ctx.t.commands.configuration.member.role.hierarchyError.get() });
                return;
            }
        }

        await guild.members.removeRole(ctx.options.member.id, ctx.options.role.id);

        void dispatchLog(ctx.client, RemoveRoleSubCommand.log({ guildId: guild.id, targetId: ctx.options.member.id, executorId: ctx.author.id, roleId: ctx.options.role.id })).catch(() => {});
        await ctx.write({ content: ctx.t.commands.configuration.member.removeRole.done.get() });
    }

    /** Builds the {@link BotActionLog} entry recording the role removal. */
    private static log({ guildId, targetId, executorId, roleId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.RemoveRole,
            color: EmbedColors.Orange,
            describe: (t) => t.systems.logs.actions.removeRole(targetId, roleId).get(),
            targetId,
            executorId,
            data: { roleId }
        });
    }
}

/** Input for {@link RemoveRoleSubCommand.log}. */
interface LogInput {
    guildId: string;
    targetId: string;
    executorId: string;
    roleId: string;
}

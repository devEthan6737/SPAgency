import type { ClientOptions, PermissionStrings } from 'seyfert';

function formatPermissions(permissions: PermissionStrings) {
    return permissions.map((permission) => String(permission)).join(', ');
}

/**
 * Default lifecycle handlers for every command (`new Client({ commands: { defaults } })`),
 * so individual commands don't each need their own permission/validation error replies.
 */
export const commandDefaults: NonNullable<ClientOptions['commands']>['defaults'] = {
    async onOptionsError(context, metadata) {
        const failed = Object.keys(metadata).filter((name) => metadata[name]?.failed);
        await context.editOrReply({ content: context.t.systems.commands.optionsError(failed.join(', ')).get() });
    },

    async onPermissionsFail(context, permissions) {
        await context.editOrReply({ content: context.t.systems.commands.permissionsFail(formatPermissions(permissions)).get() });
    },

    async onBotPermissionsFail(context, permissions) {
        await context.editOrReply({ content: context.t.systems.commands.botPermissionsFail(formatPermissions(permissions)).get() });
    },

    async onMiddlewaresError(context, error) {
        await context.editOrReply({ content: context.t.systems.commands.middlewaresError(error).get() });
    },

    async onRunError(context, error) {
        context.client.logger.error(`[${context.command.name}]`, error);
        await context.editOrReply({ content: context.t.systems.commands.runError.get() });
    },

    onInternalError(client, command, error) {
        client.logger.error(`[${command.name}]`, error);
    }
};

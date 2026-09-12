import { createMiddleware, type CommandContext } from 'seyfert';

/** Blocks the command unless the invoker is the server owner (identity-based, not a Discord permission bit). */
export const isOwner = createMiddleware<undefined, CommandContext>(async ({ context, next, stop }) => {
    if (!context.inGuild()) {
        stop();
        return;
    }

    const guild = await context.guild();
    if (context.author.id !== guild.ownerId) {
        stop(context.t.systems.commands.ownerOnly.get());
        return;
    }

    next();
});

/** Registry of this project's named middlewares, passed to `client.setServices({ middlewares: ... })` so commands can reference them (e.g. `middlewares: ['isOwner']`) by key. */
export const commandMiddlewares = { isOwner };

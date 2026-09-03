import { type AnyContext, Client, definePlugins } from 'seyfert';
import 'dotenv/config';
import { cooldown, type CooldownMiddlewares, type CooldownResult } from '@slipher/cooldown';
import { GuildRepository } from './database/repositories/guild.repository.js';
import { commandDefaults } from './systems/commands/defaults.js';
import { commandMiddlewares } from './middlewares/isOwner.middleware.js';
import { isProduction } from './systems/shared/Environment.js';

const plugins = definePlugins(
    cooldown({
        middleware: {
            global: true,
            message: (result: CooldownResult, ctx: AnyContext): string =>
                ctx.t.systems.cooldown.blocked(Math.ceil(result.remainingMs / 1000)).get()
        }
    })
);

declare module 'seyfert' {
    interface SeyfertRegistry {
        plugins: typeof plugins;
        middlewares: CooldownMiddlewares<'cooldown'> & typeof commandMiddlewares;
    }
}

const client = new Client({
    plugins,
    commands: {
        prefix: async (message) => {
            const prefix = message.guildId ? await GuildRepository.getPrefix(message.guildId) : null;
            return [prefix ?? process.env.PREFIX ?? 'sp!'];
        },
        reply: () => true,
        defaults: commandDefaults
    }
});

client.setServices({
    cache: {
        disabledCache: { bans: true, emojis: true, stickers: true, roles: true, presences: true }
    },
    langs: {
        default: 'es',
        aliases: {
            es: ['es-ES'],
            en: ['en-US', 'en-GB']
        }
    },
    middlewares: commandMiddlewares
});

await client.start();

// Never registered before this — genuinely missing, not a deliberate manual step. `cachePath` makes
// this a no-op against Discord's API on every boot where the command set hasn't actually changed
// (Seyfert hashes and compares before deciding whether to PUT anything), so calling it unconditionally
// on every start is safe. `devOnly` commands (see src/seyfert.d.ts) are stripped out of
// `client.commands.values` in production *before* `uploadCommands()` reads from it — the same array
// resolves incoming interactions, so this also makes them impossible to execute here, not just absent
// from Discord's command list.
if (isProduction()) {
    client.commands.values = client.commands.values.filter((command) => !command.props?.devOnly);
}

await client.uploadCommands({ cachePath: './commands-cache.json' });

process.on('unhandledRejection', (err) => {
    console.error(err);
});

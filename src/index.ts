import { type AnyContext, Client, definePlugins } from 'seyfert';
import 'dotenv/config';
import { cooldown, type CooldownMiddlewares, type CooldownResult } from '@slipher/cooldown';
import { GuildRepository } from './database/repositories/guild.repository.js';
import { commandDefaults } from './systems/commands/defaults.js';
import { commandMiddlewares } from './middlewares/isOwner.middleware.js';
import { Emojis } from './systems/emojis/index.js';
import { isProduction, unrecognizedBotEnv } from './systems/shared/Environment.js';

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

await Emojis.setup(client);
await client.start();

const unrecognizedEnv = unrecognizedBotEnv();
if (unrecognizedEnv) client.logger.warn(`[env] BOT_ENV="${unrecognizedEnv}" is not production, canary or developing — running as PRODUCTION, which talks to the web`);

if (isProduction()) {
    client.commands.values = client.commands.values.filter((command) => !command.props?.devOnly);
}

try {
    await client.uploadCommands();
} catch (error) {
    client.logger.error('[commands] Uploading the commands to Discord failed, keeping the ones already registered', error);
}

process.on('unhandledRejection', (err) => {
    console.error(err);
});

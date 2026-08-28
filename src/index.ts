import { type AnyContext, Client, definePlugins } from 'seyfert';
import 'dotenv/config';
import { cooldown, type CooldownMiddlewares, type CooldownResult } from '@slipher/cooldown';
import { GuildRepository } from './database/repositories/guild.repository.js';
import { commandDefaults } from './systems/commands/defaults.js';
import { commandMiddlewares } from './middlewares/isOwner.middleware.js';

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

process.on('unhandledRejection', (err) => {
    console.error(err);
});

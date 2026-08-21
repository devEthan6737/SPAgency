import { Client } from 'seyfert';
import 'dotenv/config';
import { commandDefaults } from './systems/commands/defaults.js';

const client = new Client({
    commands: {
        prefix: () => [process.env.PREFIX ?? '!'],
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
    }
});

await client.start();

process.on('unhandledRejection', (err) => {
    console.error(err);
});

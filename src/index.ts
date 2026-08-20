import { Client } from 'seyfert';
import 'dotenv/config';

const client = new Client({
    commands: {
        prefix: () => [process.env.PREFIX ?? '!'],
        reply: () => true
    }
});

client.setServices({
    cache: {
        disabledCache: { bans: true, emojis: true, stickers: true, roles: true, presences: true }
    }
});

client.start();

process.on('unhandledRejection', (err) => {
    console.error(err);
});

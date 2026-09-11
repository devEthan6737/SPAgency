import { config } from 'seyfert';
import { GatewayIntentBits } from 'seyfert/lib/types/index.js';
import 'dotenv/config';

export default config.bot({
    token: process.env.BOT_TOKEN,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        // Privileged — required for AutomodSystem (caps/emoji/word/flood detection all read
        // message.content). Must also be enabled for this application in the Discord Developer
        // Portal (Bot > Privileged Gateway Intents > Message Content Intent), or content arrives
        // empty for every guild message that doesn't @mention the bot.
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildScheduledEvents
    ],
    locations: {
        base: 'dist',
        commands: 'commands',
        events: 'events',
        langs: 'locales'
    }
});

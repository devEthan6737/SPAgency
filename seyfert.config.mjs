import { config } from 'seyfert';
import { GatewayIntentBits } from 'seyfert/lib/types/index.js';
import 'dotenv/config';

export default config.bot({
    token: process.env.BOT_TOKEN,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildScheduledEvents
    ],
    locations: {
        base: 'dist',
        commands: 'commands',
        components: 'components',
        events: 'events',
        langs: 'locales'
    }
});

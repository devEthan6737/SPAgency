import { createEvent } from 'seyfert';
import { AutomodSystem } from '../systems/automod/index.js';

/**
 * Fires whenever a server's own native Discord AutoMod rule (badwords, mass-pings...) acts on a
 * message — SPA never owns or reads those rules (see docs/moderation.md for why), it only reacts to
 * Discord's own dispatch, feeding the same warn ladder every other detector uses.
 */
export default createEvent({
    data: { name: 'autoModerationActionExecution' },
    async run(execution, client) {
        if (execution.userId === client.botId) return;

        await AutomodSystem.handleNativeAction(client, execution.guildId, execution.userId);
    }
});

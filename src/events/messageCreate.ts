import { createEvent } from 'seyfert';
import { AntiWebhooksFloodSystem, AutomodSystem } from '../systems/automod/index.js';
import { SupportSystem } from '../systems/support/index.js';

/**
 * A webhook message and a member message never both apply to the same event, so this splits cleanly
 * up front — see `AntiWebhooksFloodSystem`'s own doc comment for why webhook flood isn't just another
 * `AutomodSystem` detector. Ghostping tracking runs unconditionally for every message with a mention,
 * regardless of which branch handles the rest — see `AutomodSystem.trackForGhostping`'s doc comment
 * for why that's cheap enough to not gate behind a config check here.
 */
export default createEvent({
    data: { name: 'messageCreate' },
    async run(message, client) {
        if (SupportSystem.isTicketChannel(message.channelId)) return await SupportSystem.ingest(client, message);

        AutomodSystem.trackForGhostping(message);

        if (message.webhookId) {
            await AntiWebhooksFloodSystem.enforce(client, message);
            return;
        }

        await AutomodSystem.enforce(client, message);
    }
});

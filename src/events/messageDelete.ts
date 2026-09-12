import { createEvent } from 'seyfert';
import { AutomodSystem } from '../systems/automod/index.js';

/**
 * Fires when a message is deleted. Only ghostping cares about deletions — it can't be detected on
 * `messageCreate` since a ghostping is only known once the mentioning message disappears (see
 * docs/moderation.md). Unlike `messageCreate`, this path does check `ghostpingEnable` before acting:
 * it's a far rarer event, so the extra `GuildConfigCache` read is worth it here.
 * See `AutomodSystem.handleDelete`'s doc comment for why this is a no-op for anything that wasn't
 * tracked as a mention on the way in.
 */
export default createEvent({
    data: { name: 'messageDelete' },
    async run(message, client) {
        await AutomodSystem.handleDelete(client, message.id);
    }
});

import { createEvent } from 'seyfert';
import { SupportSystem } from '../systems/support/index.js';

/**
 * Keeps the support system's memory honest when a ticket channel is deleted by hand — a finished
 * close already removed it, so this is then a no-op. This fires for every channel deleted in every
 * server the bot is in, so it hands straight to {@link SupportSystem.forgetChannel}, which drops
 * anything outside the support server on a guild comparison before touching the index. Deletions that
 * happen while the bot is offline never arrive here; the index rebuild on the next session covers those.
 */
export default createEvent({
    data: { name: 'channelDelete' },
    /**
     * @param channel The channel that was deleted.
     */
    run(channel) {
        SupportSystem.forgetChannel('guildId' in channel ? channel.guildId : undefined, channel.id);
    }
});

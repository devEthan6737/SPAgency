import { createEvent } from 'seyfert';
import { AutomodSystem } from '../systems/automod/index.js';

/** Only ghostping cares about deletions — see `AutomodSystem.handleDelete`'s doc comment for why this is a no-op for anything that wasn't tracked as a mention on the way in. */
export default createEvent({
    data: { name: 'messageDelete' },
    async run(message, client) {
        await AutomodSystem.handleDelete(client, message.id);
    }
});

import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/** A member's roles changed — only the bot's own matter for the antiraid prerequisites (see docs/antiraid.md section 6), everyone else is a no-op. */
export default createEvent({
    data: { name: 'guildMemberUpdate' },
    async run([member], client) {
        if (member.id !== client.botId) return;
        await AntiraidSystem.recheckPrerequisites(client, member.guildId);
    }
});

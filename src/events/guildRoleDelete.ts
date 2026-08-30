import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/** A role was deleted — if it was the bot's own top role, the antiraid prerequisites may no longer hold (see docs/antiraid.md section 6). */
export default createEvent({
    data: { name: 'guildRoleDelete' },
    async run(role, client) {
        await AntiraidSystem.recheckPrerequisites(client, role.guildId);
    }
});

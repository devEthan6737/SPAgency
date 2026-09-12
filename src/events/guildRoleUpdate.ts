import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/**
 * Fires when a role's position or permissions change. Either could break the antiraid prerequisites
 * (Ban Members, View Audit Log, top-of-hierarchy role — see docs/antiraid.md section 6), so this
 * rechecks them regardless of which role was touched, rather than filtering to the bot's own role.
 */
export default createEvent({
    data: { name: 'guildRoleUpdate' },
    async run([role], client) {
        await AntiraidSystem.recheckPrerequisites(client, role.guildId);
    }
});

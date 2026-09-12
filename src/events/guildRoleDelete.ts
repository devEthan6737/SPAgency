import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/**
 * Fires when a role is deleted. Any deletion could have removed the bot's own top-of-hierarchy role,
 * so the antiraid prerequisites (see docs/antiraid.md section 6) are rechecked regardless of which
 * role it was — cheap since it's a pure gateway-cache read, no network.
 */
export default createEvent({
    data: { name: 'guildRoleDelete' },
    async run(role, client) {
        await AntiraidSystem.recheckPrerequisites(client, role.guildId);
    }
});

import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/** A role's position or permissions changed — either could break the antiraid prerequisites (see docs/antiraid.md section 6), so re-check regardless of which role it was. */
export default createEvent({
    data: { name: 'guildRoleUpdate' },
    async run([role], client) {
        await AntiraidSystem.recheckPrerequisites(client, role.guildId);
    }
});

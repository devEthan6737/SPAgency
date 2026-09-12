import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';

/**
 * Fires when a member's roles or other guild-level attributes change. Only the bot's own update
 * matters here — a role move/permission change on the bot itself can silently break the antiraid
 * prerequisites (Ban Members, View Audit Log, top-of-hierarchy role — see docs/antiraid.md section 6),
 * so it triggers an immediate `recheckPrerequisites` instead of waiting on a timer. Anyone else is a no-op.
 */
export default createEvent({
    data: { name: 'guildMemberUpdate' },
    async run([member], client) {
        if (member.id !== client.botId) return;
        await AntiraidSystem.recheckPrerequisites(client, member.guildId);
    }
});

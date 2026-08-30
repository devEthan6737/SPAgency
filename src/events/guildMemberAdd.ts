import { createEvent } from 'seyfert';
import { AntibotsSystem } from '../systems/antibots/index.js';
import { MaliciousMemberSystem } from '../systems/malicious-members/index.js';

/**
 * Seyfert only keeps one handler per event name (see `guildAuditLogEntryCreate.ts`) — every future
 * join-time protection system (antijoins, verification...) has to be added here, not in a separate file.
 */
export default createEvent({
    data: { name: 'guildMemberAdd' },
    async run(member, client) {
        await AntibotsSystem.enforce(client, member);
        await MaliciousMemberSystem.enforce(client, member);
    }
});

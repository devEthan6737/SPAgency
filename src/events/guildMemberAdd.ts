import { createEvent } from 'seyfert';
import { AntibotsSystem } from '../systems/antibots/index.js';
import { MaliciousMemberSystem } from '../systems/malicious-members/index.js';
import { RaidmodeSystem } from '../systems/raidmode/index.js';

/**
 * Seyfert only keeps one handler per event name (see `guildAuditLogEntryCreate.ts`) — every future
 * join-time protection system (antijoins, verification...) has to be added here, not in a separate
 * file. `RaidmodeSystem` runs first and, while active, substitutes for everything else here (see
 * docs/raidmode.md) — only once it passes does `MaliciousMemberSystem` get a turn, which in turn
 * short-circuits `AntibotsSystem` when it already removed the member (see its own doc comment, and
 * docs/malicious-members.md, for why a bot that's both generically blocked by antibots and known
 * malicious must end up banned, not merely kicked).
 */
export default createEvent({
    data: { name: 'guildMemberAdd' },
    async run(member, client) {
        if (await RaidmodeSystem.enforceJoin(client, member)) return;

        const removed = await MaliciousMemberSystem.enforce(client, member);
        if (!removed) await AntibotsSystem.enforce(client, member);
    }
});

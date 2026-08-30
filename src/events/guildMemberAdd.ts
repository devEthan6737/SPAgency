import { createEvent } from 'seyfert';
import { AntibotsSystem } from '../systems/antibots/index.js';
import { MaliciousMemberSystem } from '../systems/malicious-members/index.js';
import { RaidmodeSystem } from '../systems/raidmode/index.js';
import { SelfbotSystem } from '../systems/selfbot/index.js';

/**
 * Seyfert only keeps one handler per event name (see `guildAuditLogEntryCreate.ts`) — every future
 * join-time protection system (verification...) has to be added here, not in a separate file.
 * `RaidmodeSystem` runs first and, while active, substitutes for everything else here (see
 * docs/raidmode.md). After it, each system runs only if the previous one didn't already remove the
 * member — `MaliciousMemberSystem` (a confirmed blacklist hit) before `AntibotsSystem` (see its own
 * doc comment, and docs/malicious-members.md, for why a bot that's both generically blocked by
 * antibots and known malicious must end up banned, not merely kicked), and `SelfbotSystem` (a
 * heuristic, weakest signal of the three) last of all — see docs/selfbot.md.
 */
export default createEvent({
    data: { name: 'guildMemberAdd' },
    async run(member, client) {
        if (await RaidmodeSystem.enforceJoin(client, member)) return;
        if (await MaliciousMemberSystem.enforce(client, member)) return;
        if (await AntibotsSystem.enforce(client, member)) return;

        await SelfbotSystem.enforce(client, member);
    }
});

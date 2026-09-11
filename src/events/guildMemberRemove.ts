import { createEvent } from 'seyfert';
import { BotAdderSystem } from '../systems/bot-adder/index.js';

export default createEvent({
    data: { name: 'guildMemberRemove' },
    async run(member) {
        if (!member.user.bot) return;

        await BotAdderSystem.untrack(member.guildId, member.user.id).catch(() => {});
    }
});

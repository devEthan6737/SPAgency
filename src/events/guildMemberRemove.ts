import { createEvent } from 'seyfert';
import { BotAdderSystem } from '../systems/bot-adder/index.js';

/**
 * Fires when any member leaves a guild. Only bots matter here: `bot_adders` tracks "who added this
 * bot" only for the lifetime of the bot's membership (see docs/bot-adder.md), so once a bot leaves,
 * its tracking row is deleted to keep the table bounded to bots currently present.
 */
export default createEvent({
    data: { name: 'guildMemberRemove' },
    async run(member) {
        if (!member.user.bot) return;

        await BotAdderSystem.untrack(member.guildId, member.user.id).catch(() => {});
    }
});

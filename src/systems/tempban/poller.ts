import { EmbedColors, type UsingClient } from 'seyfert';
import { TempbanRepository } from '../../database/repositories/tempban.repository.js';
import { BotActionType } from '../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../logs/index.js';

/** Unbans every temp-ban whose expiry has passed. DB-backed, so pending temp-bans survive a restart. */
async function processExpiredTempbans(client: UsingClient) {
    const expired = await TempbanRepository.listExpired();

    for (const tempban of expired) {
        try {
            const guild = await client.guilds.fetch(tempban.guildId);
            await guild.bans.remove(tempban.userId, tempban.reason);

            void dispatchLog(
                client,
                new BotActionLog(tempban.guildId, {
                    type: BotActionType.Unban,
                    color: EmbedColors.Green,
                    describe: (t) => t.systems.logs.actions.unban(tempban.userId).get(),
                    targetId: tempban.userId,
                    executorId: 'system'
                })
            ).catch(() => {});
            
        } catch (error) {
            client.logger.error(`[tempban] Failed to auto-unban ${tempban.userId} in guild ${tempban.guildId}`, error);
        } finally {
            await TempbanRepository.delete(tempban.id);
        }
    }
}

/** Starts the periodic sweep that lifts expired temp-bans. Call once, from the ready event. */
export function startTempbanPoller(client: UsingClient) {
    setInterval(() => {
        void processExpiredTempbans(client).catch((error) => client.logger.error('[tempban] Poll failed', error));
    }, 60_000);
}

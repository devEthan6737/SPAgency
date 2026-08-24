import { SeyfertError, type UsingClient } from 'seyfert';
import type { PgTable } from 'drizzle-orm/pg-core';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import type { Log } from './Log.js';

function isChannelGoneError(error: unknown): boolean {
    const status = SeyfertError.is(error) ? error.metadata?.status : undefined;
    return status === 403 || status === 404;
}

/**
 * Persists a log and, if the guild has logging enabled with a channel set, sends its
 * embed there.
 *
 * A 403/404 sending it (channel deleted or access lost — common once a raid nukes
 * channels) clears the configured channel so we stop retrying a dead target; anything
 * else (a 429 included) is left to the REST client's own rate-limit queue and just
 * logged, since a busy channel isn't a reason to stop logging to it.
 */
export async function dispatchLog(client: UsingClient, log: Log<string, PgTable>) {
    await log.save();

    const settings = await GuildRepository.getLogSettings(log.guildId);
    if (!settings?.logsEnable || !settings.logsChannel) return;

    try {
        const channel = await client.channels.fetch(settings.logsChannel);
        if (!('messages' in channel)) return;

        const t = client.t(settings.language);
        await channel.messages.write({ embeds: [log.toEmbed(t)] });
    } catch (error) {
        if (isChannelGoneError(error)) {
            await GuildRepository.updateConfiguration(log.guildId, { logsChannel: null });
            return;
        }
        client.logger.error(`[logs] Failed to send a log to guild ${log.guildId}'s log channel`, error);
    }
}

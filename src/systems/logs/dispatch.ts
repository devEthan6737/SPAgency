import { SeyfertError, type Embed, type UsingClient } from 'seyfert';
import type { PgTable } from 'drizzle-orm/pg-core';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { LogChannelThrottle } from './LogChannelThrottle.js';
import type { Log } from './Log.js';

function isChannelGoneError(error: unknown): boolean {
    const status = SeyfertError.is(error) ? error.metadata?.status : undefined;
    return status === 403 || status === 404;
}

/**
 * Persists a log and, if the guild has logging enabled with a channel set, queues its embed to be
 * sent there — see {@link LogChannelThrottle} for why this doesn't just send it straight away.
 */
export async function dispatchLog(client: UsingClient, log: Log<string, PgTable>) {
    await log.save();

    const settings = await GuildRepository.getLogSettings(log.guildId);
    if (!settings?.logsEnable || !settings.logsChannel) return;

    const embed = log.toEmbed(client.t(settings.language));
    const channelId = settings.logsChannel;

    LogChannelThrottle.submit(log.guildId, embed, (embeds) => sendLogEmbeds(client, log.guildId, channelId, embeds));
}

/**
 * A 403/404 (channel deleted or access lost — common once a raid nukes channels) clears the
 * configured channel so we stop retrying a dead target; anything else is just logged.
 */
async function sendLogEmbeds(client: UsingClient, guildId: string, channelId: string, embeds: Embed[]): Promise<void> {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!('messages' in channel)) return;

        await channel.messages.write({ embeds });
    } catch (error) {
        if (isChannelGoneError(error)) {
            await GuildRepository.updateConfiguration(guildId, { logsChannel: null });
            return;
        }
        client.logger.error(`[logs] Failed to send a log to guild ${guildId}'s log channel`, error);
    }
}

import { EmbedColors, type Embed, type UsingClient } from 'seyfert';
import type { PgTable } from 'drizzle-orm/pg-core';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { GuildConfigCache } from '../protection/index.js';
import { ServerEventLog } from './events/ServerEventLog.js';
import { LogChannelThrottle } from './LogChannelThrottle.js';
import type { Log } from './Log.js';

/**
 * Persists a log and, if the guild has a log channel set, queues its embed to be sent there — see
 * {@link LogChannelThrottle} for why this doesn't just send it straight away. There's no separate
 * on/off flag: an unset channel is what "logs off" means, same as the legacy bot. `language` and
 * `logsChannel` come from `GuildConfigCache`, not a fresh query — this runs on every single logged
 * action across every guild, so it's the one place a per-call DB round-trip would actually be felt.
 */
export async function dispatchLog(client: UsingClient, log: Log<string, PgTable>) {
    await log.save();

    const settings = await GuildConfigCache.get(log.guildId);
    if (!settings?.logsChannel) return;

    const embed = log.toEmbed(client.t(settings.language));
    const channelId = settings.logsChannel;

    LogChannelThrottle.submit(log.guildId, embed, (embeds) => sendLogEmbeds(client, log.guildId, channelId, embeds));
}

/** Any failure to send (channel deleted, access lost, a persistent outage...) unsets the log channel so we stop retrying against it on every future action, instead of failing the same way forever. */
async function sendLogEmbeds(client: UsingClient, guildId: string, channelId: string, embeds: Embed[]): Promise<void> {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!('messages' in channel)) return;

        await channel.messages.write({ embeds });
    } catch (error) {
        await GuildRepository.updateConfiguration(guildId, { logsChannel: null });
        client.logger.error(`[logs] Failed to send a log to guild ${guildId}'s log channel, unsetting it`, error);

        // Not sent anywhere live (the channel that would receive it is the one we just unset) —
        // this just leaves a record in server_event_logs for the dashboard to show later.
        void dispatchLog(
            client,
            new ServerEventLog(guildId, {
                type: ServerEventType.LogsDisabled,
                color: EmbedColors.Red,
                describe: (t) => t.systems.logs.events.logsDisabled().get()
            })
        ).catch(() => {});
    }
}

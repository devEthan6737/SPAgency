import { EmbedColors, type MessageStructure, type UsingClient } from 'seyfert';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { RollingWindowCounter } from '../shared/RollingWindowCounter.js';

/**
 * Deletes the webhook responsible for a burst of messages, banning its owner on a repeat offense —
 * was `purge-webhooks-attacks.js`. Kept separate from `AutomodSystem`: a webhook isn't a member with a
 * warn history, and this doesn't go through the mute/kick/ban ladder — it's a direct security action
 * against a structural attack vector, same category as `AntiraidSystem`, not a conduct violation.
 */
export class AntiWebhooksFloodSystem {
    private static readonly WindowMs = 10_000;
    private static readonly Threshold = 4;
    private static counter = new RollingWindowCounter(AntiWebhooksFloodSystem.WindowMs);

    /** Called from `messageCreate.ts` only for messages with a `webhookId`. */
    static async enforce(client: UsingClient, message: MessageStructure): Promise<void> {
        if (!message.guildId || !message.webhookId) return;

        const settings = await GuildConfigCache.get(message.guildId);
        if (!settings?.antiWebhooksFlood) return;

        if (AntiWebhooksFloodSystem.counter.hit(message.guildId) <= AntiWebhooksFloodSystem.Threshold) return;

        const webhook = await client.webhooks.fetch(message.webhookId).catch(() => undefined);
        if (!webhook) return;

        const t = client.t(settings.language).systems.automod;

        await client.webhooks.delete(webhook.id, { reason: t.webhookFloodReason().get() }).catch(() => {});

        const ownerId = webhook.user?.id;
        const repeatOffender = ownerId !== undefined && settings.antiWebhooksFloodRememberOwner === ownerId;

        if (repeatOffender) {
            await client.bans.create(message.guildId, ownerId, { reason: t.webhookFloodRepeatReason().get() }).catch(() => {});
        } else if (ownerId) {
            await GuildRepository.updateModeration(message.guildId, { antiWebhooksFloodRememberOwner: ownerId });
        }

        void dispatchLog(client, AntiWebhooksFloodSystem.log({ guildId: message.guildId, targetId: webhook.id, bannedOwner: repeatOffender })).catch(() => {});
    }

    private static log({ guildId, targetId, bannedOwner }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.WebhookFloodPurge,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.webhookFloodPurge(targetId, bannedOwner).get(),
            targetId,
            data: { bannedOwner }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    bannedOwner: boolean;
}

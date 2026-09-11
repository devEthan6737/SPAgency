import { EmbedColors, type MessageStructure, type UsingClient } from 'seyfert';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { RollingWindowCounter } from '../shared/RollingWindowCounter.js';

/**
 * Deletes the webhook responsible for a burst of messages — was `purge-webhooks-attacks.js`. Kept
 * separate from `AutomodSystem`: a webhook isn't a member with a warn history, and this doesn't go
 * through the mute/kick/ban ladder — it's a direct security action against a structural attack vector,
 * same category as `AntiraidSystem`, not a conduct violation.
 *
 * Doesn't ban the webhook's creator, even on a repeat offense — see docs/moderation.md. A creator
 * deliberately spamming through their own `Manage Webhooks` permission is, today, a far less likely
 * threat than someone else abusing a *leaked* webhook URL/token, where the creator is the victim, not
 * the attacker. Banning them on that assumption would punish the wrong person.
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

        void dispatchLog(client, AntiWebhooksFloodSystem.log({ guildId: message.guildId, targetId: webhook.id })).catch(() => {});
    }

    private static log({ guildId, targetId }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.WebhookFloodPurge,
            color: EmbedColors.Red,
            describe: (t) => t.systems.logs.events.webhookFloodPurge(targetId).get(),
            targetId
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
}

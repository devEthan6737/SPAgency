import type { MessageStructure, UsingClient } from 'seyfert';
import { GuildConfigCache, type GuildSettings } from '../protection/index.js';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import { RollingWindowCounter } from '../shared/RollingWindowCounter.js';
import { AutomodContentDetectors } from './AutomodContentDetectors.js';
import { AutomodEscalation } from './AutomodEscalation.js';
import { AutomodDetector, type SanctionInput } from './AutomodTypes.js';

/**
 * Detects message-time conduct violations Discord's own AutoMod has no trigger for (it only analyzes
 * a single message's content, never frequency-over-time or a message's own shape/ratio) — see
 * docs/moderation.md. Badwords and mass-pings are deliberately not detected here: those go through
 * the server's native Discord AutoMod (`KEYWORD`/`MENTION_SPAM`) instead of a hand-rolled equivalent,
 * but they still feed the same escalation ladder — see {@link AutomodSystem.handleNativeAction}.
 *
 * This class only decides *whether* something tripped and gathers what {@link AutomodEscalation}
 * needs to act on it — the content checks live in {@link AutomodContentDetectors}, and everything
 * about warning/muting/kicking/banning/announcing/logging lives in `AutomodEscalation`.
 */
export class AutomodSystem {
    private static readonly FloodWindowMs = 5_000;
    private static readonly FloodThreshold = 5;
    private static floodCounter = new RollingWindowCounter(AutomodSystem.FloodWindowMs);

    /** How long a mention-carrying message stays a ghostping candidate — deleted any later than this and it no longer counts as "shortly after". */
    private static readonly GhostpingWindowMs = 60_000;
    private static ghostpingCandidates = new ExpiringMap<string, { guildId: string; channelId: string; authorId: string; mentionedUserId?: string }>();

    /** Called from `guildMemberAdd`'s sibling event, `messageCreate.ts` — never for webhook messages, see `AntiWebhooksFloodSystem` for those. */
    static async enforce(client: UsingClient, message: MessageStructure): Promise<void> {
        if (message.author.bot || !message.guildId) return;

        const settings = await GuildConfigCache.get(message.guildId);
        if (!settings) return;

        const detector = AutomodSystem.detect(settings, message);
        if (!detector) return;

        await AutomodSystem.sanction(client, { settings, message, detector });
    }

    /**
     * Called from `autoModerationActionExecution.ts` whenever a server's own native AutoMod rule
     * (badwords, mass-pings...) acts on a message. SPA doesn't own or read those rules — it only
     * reacts to Discord's own dispatch — but the violation still counts toward the same warn ladder as
     * every other detector, so someone can't dodge escalation just because the block happened to come
     * from Discord instead of from us.
     */
    static async handleNativeAction(client: UsingClient, guildId: string, userId: string): Promise<void> {
        const settings = await GuildConfigCache.get(guildId);
        if (!settings) return;

        await AutomodEscalation.sanctionUser(client, { settings, guildId, userId, channelId: null, detector: AutomodDetector.NativeAutomod });
    }

    /** Checked in a fixed order — the first one that trips wins; a message that fails more than one still only earns a single warn, same as the legacy bot. */
    private static detect(settings: GuildSettings, message: MessageStructure): AutomodDetector | null {
        if (settings.antiflood && AutomodSystem.floodCounter.hit(`${message.guildId}:${message.author.id}`) > AutomodSystem.FloodThreshold) {
            return AutomodDetector.Flood;
        }

        // Empty content can't trip any of the three content-based checks below (0 words, 0 emojis, no
        // letters to be mostly-caps) — skip straight past them instead of running all three for nothing.
        const content = message.content.trim();
        if (!content) return null;

        if (settings.manyWordsEnable && AutomodContentDetectors.countWords(content) > settings.manyWordsThreshold) return AutomodDetector.ManyWords;
        if (settings.manyEmojisEnable && AutomodContentDetectors.countEmojis(content) > settings.manyEmojisThreshold) return AutomodDetector.ManyEmojis;
        if (settings.capsLockEnable && AutomodContentDetectors.isMostlyCaps(content, settings.capsLockThreshold)) return AutomodDetector.CapsLock;

        return null;
    }

    /**
     * Ghostping can't be caught in {@link AutomodSystem.enforce} — whether it's a ghostping is only
     * knowable once the message is gone, not when it's sent. Instead, every message with a mention
     * gets a short-lived candidate entry here (cheap: a `Map.set`, no config lookup — checking
     * `ghostpingEnable` on every single message just to maybe skip tracking would cost an `await` on
     * the hottest path in the bot for no reason, since tracking itself is nearly free). The actual
     * `ghostpingEnable` check happens once, in {@link AutomodSystem.handleDelete}, which is rare by
     * comparison. Called from `messageCreate.ts` with the raw message — takes the whole structure,
     * not its individual fields, since that's all `guildId`/`channelId`/`author.id`/the mention data are.
     */
    static trackForGhostping(message: MessageStructure): void {
        if (!message.guildId) return;

        const hasMention = message.mentions.users.length > 0 || message.mentions.roles.length > 0;
        if (!hasMention) return;

        const { id: messageId, guildId, channelId, author } = message;
        const mentionedUserId = message.mentions.users[0]?.id;
        AutomodSystem.ghostpingCandidates.set(messageId, { guildId, channelId, authorId: author.id, mentionedUserId }, { ttlMs: AutomodSystem.GhostpingWindowMs });
    }

    /** Called from `messageDelete.ts` for every deletion — a no-op unless `messageId` was tracked by {@link AutomodSystem.trackForGhostping} and is still within its window. */
    static async handleDelete(client: UsingClient, messageId: string): Promise<void> {
        const candidate = AutomodSystem.ghostpingCandidates.get(messageId);
        if (!candidate) return;

        AutomodSystem.ghostpingCandidates.delete(messageId);

        const settings = await GuildConfigCache.get(candidate.guildId);
        if (!settings?.ghostpingEnable) return;

        await AutomodEscalation.sanctionUser(client, {
            settings,
            guildId: candidate.guildId,
            channelId: candidate.channelId,
            userId: candidate.authorId,
            detector: AutomodDetector.Ghostping,
            mentionedUserId: candidate.mentionedUserId
        });
    }

    /** Deletes the message where the message itself is the violation, applies flood's immediate mute, then hands off to `AutomodEscalation` for the shared warn/escalate/announce/log flow. */
    private static async sanction(client: UsingClient, { settings, message, detector }: SanctionInput): Promise<void> {
        if (AutomodEscalation.deletesMessage.has(detector)) await message.delete().catch(() => {});

        const guildId = message.guildId!;
        const userId = message.author.id;

        if (detector === AutomodDetector.Flood) {
            const reason = client.t(settings.language).systems.automod.reason.flood().get();
            await client.members.timeout(guildId, userId, AutomodEscalation.FloodTimeoutMs, reason).catch(() => {});
        }

        await AutomodEscalation.sanctionUser(client, { settings, guildId, channelId: message.channelId, userId, detector });
    }
}

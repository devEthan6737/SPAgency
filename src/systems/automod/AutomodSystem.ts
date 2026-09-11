import { EmbedColors, type MessageStructure, type SeyfertLocale, type UsingClient } from 'seyfert';
import { WarnRepository } from '../../database/repositories/warn.repository.js';
import { AutomodFinalAction } from '../../database/schema/guild-moderation.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache, type GuildSettings } from '../protection/index.js';
import { RollingWindowCounter } from '../shared/RollingWindowCounter.js';

/** Which check tripped — see docs/moderation.md for what each one actually looks at. */
type AutomodDetector = 'flood' | 'ghostping' | 'capsLock' | 'manyEmojis' | 'manyWords';

/** What the escalation ladder ended up doing about it, beyond the warn every violation always gets. */
type AutomodSanction = 'warn' | 'mute' | 'kick' | 'ban';

/**
 * Detects message-time conduct violations Discord's own AutoMod has no trigger for (it only analyzes
 * a single message's content, never frequency-over-time or a message's own shape/ratio) and escalates
 * through a shared warn ladder — see docs/moderation.md. Badwords and mass-pings are deliberately not
 * here: those go through the server's native Discord AutoMod (`KEYWORD`/`MENTION_SPAM`) instead of a
 * hand-rolled equivalent.
 */
export class AutomodSystem {
    /** Below this many non-space characters, `capsLock` never checks a message — "OK", "LOL" etc. would otherwise trip it constantly on pure noise. */
    private static readonly CapsLockMinLength = 10;

    private static readonly FloodWindowMs = 5_000;
    private static readonly FloodThreshold = 5;
    private static floodCounter = new RollingWindowCounter(AutomodSystem.FloodWindowMs);

    /** How long a mention-carrying message stays a ghostping candidate — deleted any later than this and it no longer counts as "shortly after". */
    private static readonly GhostpingWindowMs = 60_000;
    private static ghostpingCandidates = new Map<string, { guildId: string; authorId: string; reapTimer: NodeJS.Timeout }>();

    /** Called from `guildMemberAdd`'s sibling event, `messageCreate.ts` — never for webhook messages, see `AntiWebhooksFloodSystem` for those. */
    static async enforce(client: UsingClient, message: MessageStructure): Promise<void> {
        if (message.author.bot || !message.guildId) return;

        const settings = await GuildConfigCache.get(message.guildId);
        if (!settings) return;

        const detector = AutomodSystem.detect(settings, message);
        if (!detector) return;

        await AutomodSystem.sanction(client, { settings, message, detector });
    }

    /** Checked in a fixed order — the first one that trips wins; a message that fails more than one still only earns a single warn, same as the legacy bot. */
    private static detect(settings: GuildSettings, message: MessageStructure): AutomodDetector | null {
        if (settings.antiflood && AutomodSystem.floodCounter.hit(`${message.guildId}:${message.author.id}`) > AutomodSystem.FloodThreshold) {
            return 'flood';
        }

        // Empty content can't trip any of the three content-based checks below (0 words, 0 emojis, no
        // letters to be mostly-caps) — skip straight past them instead of running all three for nothing.
        const content = message.content ?? '';
        if (!content) return null;

        if (settings.manyWordsEnable && AutomodSystem.countWords(content) > settings.manyWordsThreshold) return 'manyWords';
        if (settings.manyEmojisEnable && AutomodSystem.countEmojis(content) > settings.manyEmojisThreshold) return 'manyEmojis';
        if (settings.capsLockEnable && AutomodSystem.isMostlyCaps(content, settings.capsLockThreshold)) return 'capsLock';

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
     * not its four individual fields, since that's all `guildId`/`author.id`/mention-checking/`id` are.
     */
    static trackForGhostping(message: MessageStructure): void {
        if (!message.guildId) return;

        const hasMention = message.mentions.users.length > 0 || message.mentions.roles.length > 0;
        if (!hasMention) return;

        const { id: messageId, guildId, author } = message;
        const reapTimer = setTimeout(() => AutomodSystem.ghostpingCandidates.delete(messageId), AutomodSystem.GhostpingWindowMs);
        AutomodSystem.ghostpingCandidates.set(messageId, { guildId, authorId: author.id, reapTimer });
    }

    /** Called from `messageDelete.ts` for every deletion — a no-op unless `messageId` was tracked by {@link AutomodSystem.trackForGhostping} and is still within its window. */
    static async handleDelete(client: UsingClient, messageId: string): Promise<void> {
        const candidate = AutomodSystem.ghostpingCandidates.get(messageId);
        if (!candidate) return;

        clearTimeout(candidate.reapTimer);
        AutomodSystem.ghostpingCandidates.delete(messageId);

        const settings = await GuildConfigCache.get(candidate.guildId);
        if (!settings?.ghostpingEnable) return;

        await AutomodSystem.sanctionUser(client, { settings, guildId: candidate.guildId, userId: candidate.authorId, detector: 'ghostping' });
    }

    private static countWords(content: string): number {
        return content.split(/\s+/).filter(Boolean).length;
    }

    /** Custom Discord emoji (`<a?:name:id>`) plus a broad-enough Unicode emoji range — loose on purpose, matching `SelfbotSystem`'s "don't try to nail the pattern exactly" precedent. */
    private static countEmojis(content: string): number {
        const custom = content.match(/<a?:\w+:\d+>/g) ?? [];
        const unicode = content.match(/\p{Extended_Pictographic}/gu) ?? [];
        return custom.length + unicode.length;
    }

    private static isMostlyCaps(content: string, thresholdPercent: number): boolean {
        const letters = content.replace(/[^a-zA-Z]/g, '');
        if (letters.length < AutomodSystem.CapsLockMinLength) return false;

        const upper = letters.replace(/[^A-Z]/g, '');
        return (upper.length / letters.length) * 100 >= thresholdPercent;
    }

    private static async sanction(client: UsingClient, { settings, message, detector }: SanctionInput): Promise<void> {
        await message.delete().catch(() => {});
        await AutomodSystem.sanctionUser(client, { settings, guildId: message.guildId!, userId: message.author.id, detector });
    }

    /** Shared by every detector once a violation is confirmed: warn, then escalate if the running automod count just crossed a threshold. */
    private static async sanctionUser(client: UsingClient, { settings, guildId, userId, detector }: SanctionUserInput): Promise<void> {
        const t = client.t(settings.language).systems.automod;
        const reason = t.reason[detector]().get();

        await WarnRepository.create(guildId, userId, WarnRepository.AutomodModeratorId, reason);
        const subCount = await WarnRepository.countAutomod(guildId, userId);

        let sanction: AutomodSanction = 'warn';

        if (subCount === settings.automodMuteAt) {
            sanction = 'mute';
            await client.members.timeout(guildId, userId, settings.automodMuteMinutes * 60_000, reason).catch(() => {});
        } else if (settings.automodFinalAction !== AutomodFinalAction.None && subCount === settings.automodFinalActionAt) {
            sanction = settings.automodFinalAction === AutomodFinalAction.Kick ? 'kick' : 'ban';
            if (sanction === 'kick') await client.members.kick(guildId, userId, reason).catch(() => {});
            else await client.bans.create(guildId, userId, { reason }).catch(() => {});
        }

        void dispatchLog(client, AutomodSystem.log({ guildId, targetId: userId, detector, sanction, subCount })).catch(() => {});
    }

    private static log({ guildId, targetId, detector, sanction, subCount }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.AutomodViolation,
            color: sanction === 'warn' ? EmbedColors.Yellow : EmbedColors.Orange,
            describe: (t: SeyfertLocale) => t.systems.logs.events.automodViolation(targetId, detector, sanction).get(),
            targetId,
            data: { detector, sanction, subCount }
        });
    }
}

interface LogInput {
    guildId: string;
    targetId: string;
    detector: AutomodDetector;
    sanction: AutomodSanction;
    subCount: number;
}

interface SanctionInput {
    settings: GuildSettings;
    message: MessageStructure;
    detector: AutomodDetector;
}

interface SanctionUserInput {
    settings: GuildSettings;
    guildId: string;
    userId: string;
    detector: AutomodDetector;
}

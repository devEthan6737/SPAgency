import { EmbedColors, type GuildMemberStructure, type SeyfertLocale, type UsingClient } from 'seyfert';
import { SelfbotAction } from '../../database/schema/guild-protection.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { GuildConfigCache } from '../protection/index.js';
import { parseDurationMs } from '../shared/Duration.js';

/**
 * Scores a join against a handful of cheap, no-extra-permission signals (account age, default
 * avatar, suspicious username, simultaneous joins) and acts if the score crosses a threshold — see
 * docs/selfbot.md for the full reasoning. Replaces the old `antitokens.js`, which tried to do this
 * with a broken heuristic (a `ReferenceError` on every check, silently swallowed).
 *
 * A heuristic, not a confirmed hit like `MaliciousMemberSystem` — false positives are expected, which
 * is why every signal is weighted (no single weak signal trips it alone) and the default action is a
 * reversible kick, not a ban.
 */
export class SelfbotSystem {
    private static readonly NewAccountWeight = 2;
    private static readonly DefaultAvatarWeight = 1;
    private static readonly SuspiciousNameWeight = 1;
    private static readonly JoinBurstWeight = 2;
    /** Sum of triggered weights needed to act — e.g. a new account with a default avatar (2 + 1) alone isn't enough, but add either a suspicious name or a join burst and it is. */
    private static readonly ScoreThreshold = 3;

    /** Rolling window for the "simultaneous joins" signal — see {@link SelfbotSystem.isJoinBurst}. */
    private static readonly JoinBurstWindowMs = 10_000;
    /** How many joins within the window counts as "simultaneous". */
    private static readonly JoinBurstMinCount = 3;

    private static recentJoins = new Map<string, { timestamps: number[]; reapTimer: NodeJS.Timeout }>();

    /** @returns Whether this call removed `member` (kick or ban) from the guild. */
    static async enforce(client: UsingClient, member: GuildMemberStructure): Promise<boolean> {
        if (member.bot) return false; // bots are AntibotsSystem's job entirely, not this system's

        const settings = await GuildConfigCache.get(member.guildId);
        if (!settings) return false;

        const action = settings.selfbotAction;
        if (action === SelfbotAction.None) return false;

        const signals: SelfbotSignal[] = [];
        let score = 0;

        const minAccountAgeMs = parseDurationMs(settings.selfbotMinAccountAge);
        if (Date.now() - member.user.createdTimestamp < minAccountAgeMs) {
            score += SelfbotSystem.NewAccountWeight;
            signals.push('newAccount');
        }
        if (!member.user.avatar) {
            score += SelfbotSystem.DefaultAvatarWeight;
            signals.push('defaultAvatar');
        }
        if (SelfbotSystem.hasSuspiciousName(member.user.username)) {
            score += SelfbotSystem.SuspiciousNameWeight;
            signals.push('suspiciousName');
        }
        if (SelfbotSystem.isJoinBurst(member.guildId)) {
            score += SelfbotSystem.JoinBurstWeight;
            signals.push('joinBurst');
        }

        if (score < SelfbotSystem.ScoreThreshold) return false;

        const t = client.t(settings.language);
        const reason = t.systems.selfbot.actionReason.get();

        if (action === SelfbotAction.Kick) {
            await client.members.kick(member.guildId, member.id, reason).catch(() => {});
        } else {
            await client.bans.create(member.guildId, member.id, { reason }).catch(() => {});
        }

        void dispatchLog(client, SelfbotSystem.log({ guildId: member.guildId, targetId: member.id, action, score, signals })).catch(() => {});

        return true;
    }

    /**
     * Loose on purpose: matches the shape bulk account generators commonly produce (a run of letters
     * immediately followed by a long digit suffix, or a name that's mostly digits). False positives
     * here are expected and absorbed by this signal's low weight, not by trying to nail the pattern.
     */
    private static hasSuspiciousName(username: string): boolean {
        if (/^[a-z]+\d{4,}$/i.test(username)) return true;

        const digitCount = (username.match(/\d/g) ?? []).length;
        return digitCount / username.length > 0.5;
    }

    /**
     * Whether this join is one of at least {@link SelfbotSystem.JoinBurstMinCount} within the last
     * {@link SelfbotSystem.JoinBurstWindowMs} for this guild. A small rolling counter, not
     * `BurstTracker` — that one trips once and resets, which would only flag one join per wave instead
     * of every account in it. The guild's entry reaps itself once nothing joins for a full window.
     */
    private static isJoinBurst(guildId: string): boolean {
        const now = Date.now();
        const entry = SelfbotSystem.recentJoins.get(guildId) ?? { timestamps: [], reapTimer: undefined as unknown as NodeJS.Timeout };

        entry.timestamps = entry.timestamps.filter((timestamp) => now - timestamp < SelfbotSystem.JoinBurstWindowMs);
        entry.timestamps.push(now);

        clearTimeout(entry.reapTimer);
        entry.reapTimer = setTimeout(() => SelfbotSystem.recentJoins.delete(guildId), SelfbotSystem.JoinBurstWindowMs);
        SelfbotSystem.recentJoins.set(guildId, entry);

        return entry.timestamps.length >= SelfbotSystem.JoinBurstMinCount;
    }

    private static log({ guildId, targetId, action, score, signals }: LogInput) {
        const byAction = {
            [SelfbotAction.Kick]: { color: EmbedColors.Orange, describe: (t: SeyfertLocale) => t.systems.logs.events.selfbotKick(targetId).get() },
            [SelfbotAction.Ban]: { color: EmbedColors.Red, describe: (t: SeyfertLocale) => t.systems.logs.events.selfbotBan(targetId).get() }
        }[action];

        return new ServerEventLog(guildId, {
            type: ServerEventType.SelfbotDetected,
            color: byAction.color,
            describe: byAction.describe,
            targetId,
            data: { action, score, signals }
        });
    }
}

/** One entry per signal that triggered — kept in sync with the `signals.push(...)` calls in {@link SelfbotSystem.enforce}. */
type SelfbotSignal = 'newAccount' | 'defaultAvatar' | 'suspiciousName' | 'joinBurst';

interface LogInput {
    guildId: string;
    targetId: string;
    /** Always `Kick` or `Ban` — `log()` is only reached once `enforce()` already ruled out `None`. */
    action: SelfbotAction.Kick | SelfbotAction.Ban;
    score: number;
    signals: SelfbotSignal[];
}

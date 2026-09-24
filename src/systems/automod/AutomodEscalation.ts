import { EmbedColors, type SeyfertLocale, type UsingClient } from 'seyfert';
import { WarnRepository } from '../../database/repositories/warn.repository.js';
import { AutomodFinalAction } from '../../database/schema/guild-moderation.js';
import { ServerEventType } from '../../database/schema/server-event-log.js';
import { dispatchLog, ServerEventLog } from '../logs/index.js';
import { AutomodDetector, AutomodSanction, type AnnounceInput, type LogInput, type SanctionUserInput } from './AutomodTypes.js';

/**
 * What happens once a violation is confirmed — shared by every `AutomodSystem` detector and by native
 * AutoMod hits (`AutomodSystem.handleNativeAction`): warn, escalate if the running automod count just
 * crossed a threshold, announce in-channel where that beats just acting, log. See docs/moderation.md.
 */
export class AutomodEscalation {
    /** Immediate, fixed mute the moment flood trips — independent of the ladder below, which still runs on top and can extend this into a longer mute or a kick/ban. Acting beats explaining here, so `announce()` never runs for `Flood` — see docs/moderation.md. */
    static readonly FloodTimeoutMs = 15_000;

    /** Detectors whose triggering message is itself the violation, and so gets deleted — `Flood` deliberately isn't one (15 flooded messages are evidence, not something to erase), and `Ghostping`/`NativeAutomod` never reach this decision (the message is already gone, or Discord already blocked it). */
    static readonly deletesMessage: ReadonlySet<AutomodDetector> = new Set([AutomodDetector.CapsLock, AutomodDetector.ManyEmojis, AutomodDetector.ManyWords]);

    /** How long an in-channel violation announcement stays up before deleting itself. */
    private static readonly AnnouncementLifetimeMs = 8_000;

    /** Warn, then escalate if the running automod count just crossed a threshold. */
    static async sanctionUser(client: UsingClient, { settings, guildId, channelId, userId, detector, mentionedUserId }: SanctionUserInput): Promise<void> {
        const t = client.t(settings.language).systems.automod;
        const reason = t.reason[detector]().get();

        await WarnRepository.create({
            guildId,
            userId,
            moderatorId: WarnRepository.AutomodModeratorId,
            reason
        });
        
        const subCount = await WarnRepository.countAutomod(guildId, userId);

        let sanction = AutomodSanction.Warn;

        if (subCount === settings.automodMuteAt) {
            sanction = AutomodSanction.Mute;
            await client.members.timeout(guildId, userId, settings.automodMuteMinutes * 60_000, reason).catch(() => {});
        } else if (settings.automodFinalAction !== AutomodFinalAction.None && subCount === settings.automodFinalActionAt) {
            sanction = settings.automodFinalAction === AutomodFinalAction.Kick ? AutomodSanction.Kick : AutomodSanction.Ban;
            if (sanction === AutomodSanction.Kick) await client.members.kick(guildId, userId, reason).catch(() => {});
            else await client.bans.create(guildId, userId, { reason }).catch(() => {});
        }

        if (channelId) await AutomodEscalation.announce(client, channelId, { detector, userId, mentionedUserId, t });

        void dispatchLog(client, AutomodEscalation.log({ guildId, targetId: userId, detector, sanction, subCount })).catch(() => {});
    }

    /**
     * Posts a short-lived, self-deleting notice for the detectors where explaining beats just acting.
     * `Flood` (act now, no chat noise) and `NativeAutomod` (Discord's own block message already told
     * the user why) fall through the `switch` and post nothing — a genuine per-branch difference (only
     * `Ghostping` needs a second id), not a data lookup, so this stays a `switch`, not a `Record`.
     */
    private static async announce(client: UsingClient, channelId: string, { detector, userId, mentionedUserId, t }: AnnounceInput): Promise<void> {
        let content: string;

        switch (detector) {
            case AutomodDetector.Ghostping:
                content = t.announce.ghostping(userId, mentionedUserId).get();
                break;
            case AutomodDetector.CapsLock:
            case AutomodDetector.ManyEmojis:
            case AutomodDetector.ManyWords:
                content = t.announce[detector](userId).get();
                break;
            default:
                return;
        }

        const sent = await client.messages.write(channelId, { content }).catch(() => undefined);
        if (!sent) return;

        setTimeout(() => {
            void client.messages.delete(sent.id, channelId).catch(() => {});
        }, AutomodEscalation.AnnouncementLifetimeMs);
    }

    private static log({ guildId, targetId, detector, sanction, subCount }: LogInput) {
        return new ServerEventLog(guildId, {
            type: ServerEventType.AutomodViolation,
            color: sanction === AutomodSanction.Warn ? EmbedColors.Yellow : EmbedColors.Orange,
            describe: (t: SeyfertLocale) => t.systems.logs.events.automodViolation(targetId, detector, sanction).get(),
            targetId,
            data: { detector, sanction, subCount }
        });
    }
}

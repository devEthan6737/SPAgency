import type { MessageStructure, SeyfertLocale } from 'seyfert';
import type { GuildSettings } from '../protection/index.js';

/** Which check tripped — see docs/moderation.md for what each one actually looks at. */
export enum AutomodDetector {
    Flood = 'flood',
    Ghostping = 'ghostping',
    CapsLock = 'capsLock',
    ManyEmojis = 'manyEmojis',
    ManyWords = 'manyWords',
    NativeAutomod = 'nativeAutomod'
}

/** What the escalation ladder ended up doing about it, beyond the warn every violation always gets. */
export enum AutomodSanction {
    Warn = 'warn',
    Mute = 'mute',
    Kick = 'kick',
    Ban = 'ban'
}

/** Input for `AutomodEscalation.log` — everything needed to describe one already-decided violation. */
export interface LogInput {
    guildId: string;
    targetId: string;
    detector: AutomodDetector;
    sanction: AutomodSanction;
    subCount: number;
}

/** Input for `AutomodSystem`'s private `sanction()` — a detector that tripped on a live message. */
export interface SanctionInput {
    settings: GuildSettings;
    message: MessageStructure;
    detector: AutomodDetector;
}

/** Input for `AutomodEscalation.sanctionUser` — a confirmed violation, from any detector (own or native), about to be warned/escalated. */
export interface SanctionUserInput {
    settings: GuildSettings;
    guildId: string;
    /** `null` skips the in-channel announcement entirely — used by `AutomodSystem.handleNativeAction`, which has no channel worth trusting (and no need to announce, see its own doc comment). */
    channelId: string | null;
    userId: string;
    detector: AutomodDetector;
    /** Only meaningful for `Ghostping` — who the deleted message mentioned, if anyone in particular. */
    mentionedUserId?: string;
}

/** Input for `AutomodEscalation.announce` — the pieces needed to render the right in-channel notice. */
export interface AnnounceInput {
    detector: AutomodDetector;
    userId: string;
    mentionedUserId?: string;
    t: SeyfertLocale['systems']['automod'];
}

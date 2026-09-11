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

export interface LogInput {
    guildId: string;
    targetId: string;
    detector: AutomodDetector;
    sanction: AutomodSanction;
    subCount: number;
}

export interface SanctionInput {
    settings: GuildSettings;
    message: MessageStructure;
    detector: AutomodDetector;
}

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

export interface AnnounceInput {
    detector: AutomodDetector;
    userId: string;
    mentionedUserId?: string;
    t: SeyfertLocale['systems']['automod'];
}

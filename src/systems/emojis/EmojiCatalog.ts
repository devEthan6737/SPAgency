import { AppEmojiName } from './AppEmojiName.js';
import { EmojiKey } from './EmojiKey.js';

/** How one {@link EmojiKey} is drawn. */
export interface EmojiDefinition {
    /** The uploaded application emoji to use when the running application has it. */
    readonly name: AppEmojiName;
    /** What is shown instead when it doesn't, so a missing upload never breaks a message. */
    readonly fallback: string;
}

/**
 * Every {@link EmojiKey} and its emoji. It is a `Record`, so adding a key without an entry here is a
 * compile error; and {@link EveryEmojiIsUsed} makes it a compile error too for an {@link AppEmojiName}
 * that no key points to.
 */
export const EmojiCatalog = {
    [EmojiKey.Success]: { name: AppEmojiName.FbmYes, fallback: '✅' },
    [EmojiKey.Error]: { name: AppEmojiName.FbmNo, fallback: '❌' },
    [EmojiKey.Warning]: { name: AppEmojiName.FbmAlert, fallback: '⚠️' },
    [EmojiKey.Ban]: { name: AppEmojiName.FbmHammer, fallback: '🔨' },
    [EmojiKey.Raid]: { name: AppEmojiName.FbmAnnounce, fallback: '🚨' },
    [EmojiKey.Welcome]: { name: AppEmojiName.FbmUser, fallback: '👋' },
    [EmojiKey.Attachment]: { name: AppEmojiName.FbmLink, fallback: '📎' },
    [EmojiKey.Backup]: { name: AppEmojiName.FbmStats, fallback: '📦' },
    [EmojiKey.MessageLatency]: { name: AppEmojiName.FbmDiscord, fallback: '🌐' },
    [EmojiKey.ApiLatency]: { name: AppEmojiName.RiconcCpu, fallback: '🤖' },
    [EmojiKey.DatabaseLatency]: { name: AppEmojiName.RiconcRam, fallback: '📚' },
    [EmojiKey.Cpu]: { name: AppEmojiName.RiconcCpu, fallback: '⚙️' },
    [EmojiKey.Ram]: { name: AppEmojiName.RiconcRam, fallback: '💾' },

    [EmojiKey.Boost]: { name: AppEmojiName.FbmBoost, fallback: '🚀' },
    [EmojiKey.Luck]: { name: AppEmojiName.FbmLuck, fallback: '🍀' },
    [EmojiKey.Partner]: { name: AppEmojiName.FbmPartner, fallback: '🤝' },
    [EmojiKey.YoutubeBadge]: { name: AppEmojiName.FbmYoutube, fallback: '▶️' },
    [EmojiKey.YoutubeLogo]: { name: AppEmojiName.RiconYoutube, fallback: '📺' },

    [EmojiKey.BetaStart]: { name: AppEmojiName.RiconBetaPart1, fallback: 'BE' },
    [EmojiKey.BetaEnd]: { name: AppEmojiName.RiconBetaPart2, fallback: 'TA' },
    [EmojiKey.Developer]: { name: AppEmojiName.RiconDev, fallback: '🧑‍💻' },
    [EmojiKey.Heart]: { name: AppEmojiName.RiconHeart, fallback: '❤️' },
    [EmojiKey.Arrow]: { name: AppEmojiName.RiconOldArrow, fallback: '»' },
    [EmojiKey.Visa]: { name: AppEmojiName.RiconVisa, fallback: '💳' },

    [EmojiKey.LoadingSpinner]: { name: AppEmojiName.RiconLoading1OldProgram, fallback: '⏳' },
    [EmojiKey.LoadingGray]: { name: AppEmojiName.RiconLoading2Gray, fallback: '⚪' },
    [EmojiKey.LoadingGreen]: { name: AppEmojiName.RiconLoading3Green, fallback: '🟢' },
    [EmojiKey.LoadingBlue]: { name: AppEmojiName.RiconLoading4Blue, fallback: '🔵' },

    [EmojiKey.JavaScript]: { name: AppEmojiName.RicontJavascript, fallback: 'JS' },
    [EmojiKey.PostgreSql]: { name: AppEmojiName.RicontPostgresql, fallback: '🐘' },
    [EmojiKey.Seyfert]: { name: AppEmojiName.RicontSeyfert, fallback: 'Seyfert' },
    [EmojiKey.TypeScript]: { name: AppEmojiName.RicontTs, fallback: 'TS' },

    [EmojiKey.Book]: { name: AppEmojiName.RiconwBook, fallback: '📖' },
    [EmojiKey.Document]: { name: AppEmojiName.RiconwDocument, fallback: '📄' },

    [EmojiKey.SuccessAnimated]: { name: AppEmojiName.RiconynYes, fallback: '✅' },
    [EmojiKey.ErrorAnimated]: { name: AppEmojiName.RiconynNo, fallback: '❌' },

    [EmojiKey.StarBlack]: { name: AppEmojiName.StarBlack, fallback: '⭐' },
    [EmojiKey.StarBlue]: { name: AppEmojiName.StarBlue, fallback: '⭐' },
    [EmojiKey.StarPurple]: { name: AppEmojiName.StarPurple, fallback: '⭐' },
    [EmojiKey.StarRed]: { name: AppEmojiName.StarRed, fallback: '⭐' },
    [EmojiKey.StarYellow]: { name: AppEmojiName.StarYellow, fallback: '⭐' }
} as const satisfies Readonly<Record<EmojiKey, EmojiDefinition>>;

/** The {@link AppEmojiName}s no {@link EmojiKey} points to. Empty by design. */
type UnusedEmojiNames = Exclude<AppEmojiName, (typeof EmojiCatalog)[EmojiKey]['name']>;

/**
 * Compile-time check, never read: it only type-checks while {@link UnusedEmojiNames} is empty, so
 * registering an {@link AppEmojiName} without giving it a key fails the build and names the emoji.
 */
export type EveryEmojiIsUsed = [UnusedEmojiNames] extends [never] ? true : { unusedEmojis: UnusedEmojiNames };
export const everyEmojiIsUsed: EveryEmojiIsUsed = true;

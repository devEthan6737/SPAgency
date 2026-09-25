/**
 * What a message means to say, independent of which image shows it. Locales ask for a key; the
 * {@link EmojiCatalog} decides which uploaded emoji (or which unicode fallback) it becomes. There is
 * one key per uploaded emoji, so every one of them has a place to be used from.
 */
export enum EmojiKey {
    Success = 'success',
    Error = 'error',
    Warning = 'warning',
    Ban = 'ban',
    Raid = 'raid',
    Welcome = 'welcome',
    Attachment = 'attachment',
    Backup = 'backup',
    MessageLatency = 'messageLatency',
    ApiLatency = 'apiLatency',
    DatabaseLatency = 'databaseLatency',
    Cpu = 'cpu',
    Ram = 'ram',

    Boost = 'boost',
    Luck = 'luck',
    Partner = 'partner',
    YoutubeBadge = 'youtubeBadge',
    YoutubeLogo = 'youtubeLogo',

    /** First half of the two-piece BETA badge ("BE"). */
    BetaStart = 'betaStart',
    /** Second half of the two-piece BETA badge ("TA"). */
    BetaEnd = 'betaEnd',
    Developer = 'developer',
    Heart = 'heart',
    Arrow = 'arrow',
    Visa = 'visa',

    LoadingSpinner = 'loadingSpinner',
    LoadingGray = 'loadingGray',
    LoadingGreen = 'loadingGreen',
    LoadingBlue = 'loadingBlue',

    JavaScript = 'javaScript',
    PostgreSql = 'postgreSql',
    Seyfert = 'seyfert',
    TypeScript = 'typeScript',

    Book = 'book',
    Document = 'document',

    SuccessAnimated = 'successAnimated',
    ErrorAnimated = 'errorAnimated',

    StarBlack = 'starBlack',
    StarBlue = 'starBlue',
    StarPurple = 'starPurple',
    StarRed = 'starRed',
    StarYellow = 'starYellow'
}

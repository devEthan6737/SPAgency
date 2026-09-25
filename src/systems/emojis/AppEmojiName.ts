/**
 * Exact names of the application emojis uploaded to each Discord application (production, canary and
 * developing). The names are identical in the three; only the ids differ, which is why the code keeps
 * names and resolves the ids at startup (see {@link Emojis}). All of them are registered here even
 * when nothing uses them yet, so `Emojis.missing()` can tell which ones an application still lacks.
 */
export enum AppEmojiName {
    FbmAlert = 'sp_fbm_alert',
    FbmAnnounce = 'sp_fbm_announce',
    FbmBoost = 'sp_fbm_boost',
    FbmDiscord = 'sp_fbm_discord',
    FbmHammer = 'sp_fbm_hammer',
    FbmLink = 'sp_fbm_link',
    FbmLuck = 'sp_fbm_luck',
    FbmNo = 'sp_fbm_no',
    FbmPartner = 'sp_fbm_partner',
    FbmStats = 'sp_fbm_stats',
    FbmUser = 'sp_fbm_user',
    FbmYes = 'sp_fbm_yes',
    FbmYoutube = 'sp_fbm_youtube',

    RiconBetaPart1 = 'sp_ricon_beta_part1',
    RiconBetaPart2 = 'sp_ricon_beta_part2',
    RiconDev = 'sp_ricon_dev',
    RiconHeart = 'sp_ricon_heart',
    /** Animated. */
    RiconLoading1OldProgram = 'sp_ricon_loading1_oldprogram',
    /** Animated. */
    RiconLoading2Gray = 'sp_ricon_loading2_gray',
    /** Animated. */
    RiconLoading3Green = 'sp_ricon_loading3_green',
    /** Animated. */
    RiconLoading4Blue = 'sp_ricon_loading4_blue',
    RiconOldArrow = 'sp_ricon_oldarrow',
    RiconVisa = 'sp_ricon_visa',
    RiconYoutube = 'sp_ricon_youtube',

    RiconcCpu = 'sp_riconc_cpu',
    RiconcRam = 'sp_riconc_ram',

    RicontJavascript = 'sp_ricont_javascript',
    RicontPostgresql = 'sp_ricont_postgresql',
    RicontSeyfert = 'sp_ricont_seyfert',
    RicontTs = 'sp_ricont_ts',

    RiconwBook = 'sp_riconw_book',
    RiconwDocument = 'sp_riconw_document',

    /** Animated. */
    RiconynYes = 'sp_riconyn_yes',
    /** Animated. */
    RiconynNo = 'sp_riconyn_no',

    StarBlack = 'sp_star_black',
    StarBlue = 'sp_star_blue',
    StarPurple = 'sp_star_purple',
    StarRed = 'sp_star_red',
    StarYellow = 'sp_star_yellow'
}

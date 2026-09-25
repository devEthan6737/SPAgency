import type { CommandContext } from 'seyfert';

/** The part of a command, subcommand or option that carries a name and a description in several languages. */
export interface Localizable {
    name: string;
    description: string;
    name_localizations?: Partial<Record<string, string | null>> | null;
    description_localizations?: Partial<Record<string, string | null>> | null;
}

/**
 * Reads the name and description a command shows to the person asking, in their language. Seyfert fills
 * `name_localizations` and `description_localizations` from the locale files, keyed by Discord locale
 * (`es-ES`, `en-US`...); the base `name` and `description` are the English ones Discord falls back to.
 */
export class CommandLocalizer {
    /**
     * Picks the locale to read localizations with, the same way `ctx.t` picks the language.
     * @param ctx The command context.
     * @returns A Discord locale such as `es-ES`. A prefix command has no interaction, so it gets the
     * default language's first Discord locale.
     */
    static locale(ctx: CommandContext): string {
        const { langs } = ctx.client;
        const interaction = ctx.interaction;
        const raw = (langs.preferGuildLocale ? (interaction?.guildLocale ?? interaction?.locale) : interaction?.locale) ?? langs.defaultLang ?? 'en-US';

        return langs.aliases.find(([lang]) => lang === raw)?.[1][0] ?? raw;
    }

    /**
     * @param item A command, subcommand or option.
     * @param locale From {@link CommandLocalizer.locale}.
     * @returns Its name in that language, or the base name if it has none.
     */
    static name(item: Localizable, locale: string): string {
        return item.name_localizations?.[locale] ?? item.name;
    }

    /**
     * @param item A command, subcommand or option.
     * @param locale From {@link CommandLocalizer.locale}.
     * @returns Its description in that language, or the base description if it has none.
     */
    static description(item: Localizable, locale: string): string {
        return item.description_localizations?.[locale] ?? item.description;
    }

    /**
     * @param item A command, subcommand or option.
     * @param query What someone typed.
     * @returns Whether it is that command's base name or its name in any language, ignoring case.
     */
    static matches(item: Localizable, query: string): boolean {
        const wanted = query.toLowerCase();

        return [item.name, ...Object.values(item.name_localizations ?? {})].some((name) => name?.toLowerCase() === wanted);
    }
}

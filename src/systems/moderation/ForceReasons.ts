import type { AutocompleteInteraction, SeyfertChoice } from 'seyfert';
import { GuildRepository } from '../../database/repositories/guild.repository.js';

export type ForceReasonResult = { ok: true; reason: string } | { ok: false; allowed: string[] };

/**
 * Enforces a server's predefined moderation reasons (`guild_moderation.forceReasons`, set up via
 * the dashboard) when it has any — a moderation command can't take a free-text reason anymore once
 * the server opts into a fixed list. Servers with no list configured keep working exactly as before.
 */
export class ForceReasons {
    /**
     * Resolves the reason to actually use for a moderation action. If the guild has a predefined
     * list, `given` must match one of them (case/whitespace-insensitive) — anything else fails with
     * the valid options attached, for the caller to turn into its own guard clause. With no list
     * configured, `given` is used as-is, falling back to `fallback` if unset.
     */
    static async resolve(guildId: string, given: string | undefined, fallback?: string): Promise<ForceReasonResult> {
        const allowed = await GuildRepository.getForceReasons(guildId);
        if (allowed.length === 0) return { ok: true, reason: given ?? fallback ?? '' };

        const match = allowed.find((reason) => reason.trim().toLowerCase() === given?.trim().toLowerCase());
        if (match) return { ok: true, reason: match };

        return { ok: false, allowed };
    }

    /** Autocomplete for a `reason` option — suggests the guild's predefined reasons, if any. */
    static async autocomplete(interaction: AutocompleteInteraction<boolean, string>): Promise<void> {
        if (!interaction.guildId) return void interaction.respond([]);

        const allowed = await GuildRepository.getForceReasons(interaction.guildId);
        const input = interaction.getInput().toLowerCase();

        const choices: SeyfertChoice<string>[] = allowed
            .filter((reason) => reason.toLowerCase().includes(input))
            .slice(0, 25)
            .map((reason) => ({ name: reason, value: reason }));

        await interaction.respond(choices);
    }
}

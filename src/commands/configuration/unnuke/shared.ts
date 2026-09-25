import type { CommandContext } from 'seyfert';
import { Confirmation } from '../../../systems/confirmation/index.js';

/** An entry a cleanup would delete, with the name it shares with an earlier one. */
export interface DuplicateEntry<T> {
    entry: T;
    name: string;
}

/** What {@link UnnukeHelpers.confirm} needs to ask about a deletion. */
export interface UnnukeConfirmation {
    /** How many things would be deleted. Zero means there is nothing to ask about. */
    count: number;
    /** The warning shown with the confirm and cancel buttons. */
    prompt: string;
}

/** Shared helpers for the unnuke subcommands: the duplicate-name cleanup logic and the confirmation before it runs. Cooldown is handled by @slipher/cooldown, see @Cooldown.user on each subcommand. */
export class UnnukeHelpers {
    /**
     * Finds what a cleanup would delete: every entry that shares a name with an earlier one. The
     * earliest of each name is kept, since it may well be the original.
     * @param entries Everything to check, in the order that decides which one counts as earlier.
     * @param getName Reads an entry's name. Entries without one are ignored.
     * @returns The later duplicates, in order, each with the name it repeats.
     */
    static findDuplicates<T>(entries: T[], getName: (entry: T) => string | null | undefined): DuplicateEntry<T>[] {
        const seenNames = new Set<string>();
        const duplicates: DuplicateEntry<T>[] = [];

        for (const entry of entries) {
            const name = getName(entry);
            if (!name) continue;

            if (seenNames.has(name)) duplicates.push({ entry, name });
            else seenNames.add(name);
        }

        return duplicates;
    }

    /**
     * Deletes entries one by one. A failure on one doesn't stop the rest.
     * @param entries What to delete.
     * @param remove Deletes a single entry.
     * @returns How many deletions were attempted.
     */
    static async removeAll<T>(entries: T[], remove: (entry: T) => Promise<unknown>): Promise<number> {
        let removed = 0;

        for (const entry of entries) {
            await remove(entry).catch(() => {});
            removed++;
        }

        return removed;
    }

    /**
     * Finds and deletes every entry sharing a name with an earlier one, with no confirmation. For
     * callers that already asked in their own way, like `/backup load`.
     * @param entries Everything to check, in order.
     * @param getName Reads an entry's name. Entries without one are ignored.
     * @param remove Deletes a single entry.
     * @returns How many deletions were attempted.
     */
    static async deleteDuplicates<T>(entries: T[], getName: (entry: T) => string | null | undefined, remove: (entry: T) => Promise<unknown>): Promise<number> {
        const duplicates = UnnukeHelpers.findDuplicates(entries, getName);
        return await UnnukeHelpers.removeAll(
            duplicates.map(({ entry }) => entry),
            remove
        );
    }

    /**
     * Shortens a list of names to something that fits in a confirmation prompt.
     * @param names Every name, already formatted the way it should read.
     * @returns The first ten separated by commas, followed by `+N` for the rest.
     */
    static preview(names: string[]): string {
        const shown = names.slice(0, 10).join(', ');
        return names.length > 10 ? `${shown}, +${names.length - 10}` : shown;
    }

    /**
     * Asks the invoker to confirm a deletion before anything is touched. A cleanup can't tell a
     * duplicate made by a raid from one made on purpose, so the invoker sees what is about to go.
     * The cooldown is taken before the command runs, so when nothing gets deleted (nothing found,
     * cancelled, or no answer in time) it is given back rather than costing the invoker 15 minutes.
     * @param ctx The subcommand's context; the prompt is its reply and only its author can answer.
     * @param confirmation How many things would go, and the warning to show.
     * @returns `true` only if the invoker confirmed. When nothing was found, that is also reported here.
     */
    static async confirm(ctx: CommandContext, { count, prompt }: UnnukeConfirmation): Promise<boolean> {
        const t = ctx.t.commands.configuration.unnuke;

        if (count === 0) {
            await ctx.write({ content: t.nothing.get() });
            await ctx.cooldown.reset();
            return false;
        }

        const confirmed = await Confirmation.ask(ctx, { description: prompt, confirmLabel: t.confirmLabel.get(), cancelLabel: t.cancelLabel.get() });
        if (!confirmed) await ctx.cooldown.reset();

        return confirmed;
    }
}

/** Shared helpers for the unnuke subcommands: the duplicate-name cleanup logic. Cooldown is handled by @slipher/cooldown, see @Cooldown.user on each subcommand. */
export class UnnukeHelpers {
    /** Deletes every entry sharing a name (via `getName`) with an earlier one in `entries`. */
    static async deleteDuplicates<T>(
        entries: T[],
        getName: (entry: T) => string | null | undefined,
        remove: (entry: T) => Promise<unknown>
    ) {
        const seenNames = new Set<string>();
        let removed = 0;

        for (const entry of entries) {
            const name = getName(entry);
            if (!name) continue;
            if (seenNames.has(name)) {
                await remove(entry).catch(() => {});
                removed++;
            } else {
                seenNames.add(name);
            }
        }

        return removed;
    }
}

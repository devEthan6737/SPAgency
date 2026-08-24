import type { CommandContext } from 'seyfert';

/** Shared helpers for the unnuke subcommands: the per-user cooldown and the duplicate-name cleanup logic. */
export class UnnukeHelpers {
    private static cooldowns = new Map<string, number>();

    /** True and starts the cooldown if the user is clear to run an unnuke subcommand, false (and replies) otherwise. */
    static async checkCooldown(ctx: CommandContext): Promise<boolean> {
        const expiresAt = UnnukeHelpers.cooldowns.get(ctx.author.id);
        if (expiresAt && expiresAt > Date.now()) {
            await ctx.write({ content: ctx.t.commands.configuration.unnuke.onCooldown.get() });
            return false;
        }

        UnnukeHelpers.cooldowns.set(ctx.author.id, Date.now() + 15 * 60 * 1000);
        return true;
    }

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

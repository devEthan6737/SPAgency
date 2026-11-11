/** The slice of a guild member {@link ModerationGuard} reads, satisfied by Seyfert's member structures. */
export interface RankedMember {
    id: string;
    roles: { highest(): Promise<{ position: number } | undefined> };
}

/** Checks shared by every command that acts on a specific member. */
export class ModerationGuard {
    /**
     * Whether `invoker` may act on `target`: the guild owner always may, anyone else needs a strictly
     * higher top role. Discord only validates the *bot's* hierarchy, never the invoker's, so every
     * command targeting a member that exists in the guild has to run this itself.
     * @param invoker Who runs the command.
     * @param target The member it acts on.
     * @param ownerId The guild owner's id, exempt from the check.
     * @returns Whether `invoker` outranks `target`.
     */
    static async outranks(invoker: RankedMember, target: RankedMember, ownerId: string): Promise<boolean> {
        if (invoker.id === ownerId) return true;

        const [invokerHighest, targetHighest] = await Promise.all([invoker.roles.highest(), target.roles.highest()]);
        return (invokerHighest?.position ?? 0) > (targetHighest?.position ?? 0);
    }
}

import type { UsingClient } from 'seyfert';

/**
 * Whether the bot can actually enforce the antiraid, not whether the toggle is on. The bot's own
 * member/roles come from gateway cache, but the guild's role list is fetched over REST (the role
 * cache is disabled in `src/index.ts`). See docs/antiraid.md section 6 for why this has to be
 * checked continuously, not just once when the toggle is flipped.
 */
export class AntiraidPrerequisites {
    /**
     * @returns `true`/`false` when the bot in `guildId` does/doesn't currently have Ban Members, View
     * Audit Log, and the highest role position in the guild, or `undefined` when that couldn't be
     * determined (a REST/network failure), which callers must not treat as "not met".
     */
    static async meets(client: UsingClient, guildId: string): Promise<boolean | undefined> {
        try {
            const me = await client.guilds.fetchSelf(guildId);
            const permissions = await me.roles.permissions();
            if (!permissions.has(['BanMembers', 'ViewAuditLog'])) return false;

            const roles = await client.roles.list(guildId);
            if (roles.length === 0) return undefined;

            const highestPosition = Math.max(...roles.map((role) => role.position));
            const myHighestPosition = Math.max(0, ...roles.filter((role) => me.roles.keys.includes(role.id)).map((role) => role.position));

            return myHighestPosition === highestPosition;
        } catch {
            return undefined;
        }
    }
}

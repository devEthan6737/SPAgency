import type { UsingClient } from 'seyfert';

/**
 * Whether the bot can actually enforce the antiraid — not whether the toggle is on. All three
 * checks come straight from gateway cache (no REST call): the bot's own member/roles are synced
 * via `GUILD_CREATE`/`GUILD_MEMBER_UPDATE`, and the guild's role list via `GUILD_ROLE_UPDATE`/
 * `GUILD_ROLE_DELETE`. See docs/antiraid.md section 6 for why this has to be checked continuously,
 * not just once when the toggle is flipped.
 */
export class AntiraidPrerequisites {
    static async meets(client: UsingClient, guildId: string): Promise<boolean> {
        try {
            const me = await client.guilds.fetchSelf(guildId);
            const permissions = await me.roles.permissions();
            if (!permissions.has(['BanMembers', 'ViewAuditLog'])) return false;

            const roles = await client.roles.list(guildId);
            if (roles.length === 0) return false;

            const highestPosition = Math.max(...roles.map((role) => role.position));
            const myHighestPosition = Math.max(0, ...roles.filter((role) => me.roles.keys.includes(role.id)).map((role) => role.position));

            return myHighestPosition === highestPosition;
        } catch {
            return false;
        }
    }
}

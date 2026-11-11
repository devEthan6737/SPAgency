import type { UsingClient } from 'seyfert';
import { GuildRepository } from '../../database/repositories/guild.repository.js';
import { GuildConfigCache } from './GuildConfigCache.js';

/** Keeps the `guilds` table in step with the guilds the bot is actually in, covering what no gateway event can: changes while the bot was offline. */
export class GuildSync {
    /** How long a guild's row (and its backup) survives after the bot leaves it. */
    private static readonly GraceMs = 30 * 24 * 60 * 60 * 1000;
    private static readonly PageSize = 200;

    /**
     * Creates the rows of guilds added while the bot was offline (the gateway reports those as
     * `rawGuildCreate` at startup, never `guildCreate`), un-flags the ones it rejoined, flags the ones
     * it was removed from, and purges the ones that stayed gone past the grace period. Does nothing if
     * Discord's guild list can't be read, since a failed read must never look like "the bot left everywhere".
     * @param client Bot client, to list its guilds.
     * @returns Resolves once the sync is done.
     */
    static async run(client: UsingClient): Promise<void> {
        const presentIds = await GuildSync.listPresentIds(client);
        if (!presentIds) return;

        const stored = new Map((await GuildRepository.listMembership()).map((row) => [row.id, row.left]));
        for (const id of presentIds) {
            if (stored.has(id)) {
                if (stored.get(id)) await GuildRepository.updateCore(id, { leftAt: null });
                continue;
            }

            const guild = await client.guilds.fetch(id).catch(() => undefined);
            if (guild) await GuildRepository.findOrCreate(id, guild.ownerId);
            GuildConfigCache.invalidate(id);
        }

        const present = new Set(presentIds);
        await GuildRepository.markLeftMany([...stored.keys()].filter((id) => !present.has(id)));
        await GuildRepository.purgeLeftBefore(new Date(Date.now() - GuildSync.GraceMs));
    }

    /**
     * @param client Bot client, to page through its guilds.
     * @returns Every guild id the bot is in, or `undefined` if Discord's list couldn't be read.
     */
    private static async listPresentIds(client: UsingClient): Promise<string[] | undefined> {
        const ids: string[] = [];
        try {
            let after: string | undefined;
            for (;;) {
                const page = await client.guilds.list({ limit: GuildSync.PageSize, after }, true);
                ids.push(...page.map((guild) => guild.id));
                if (page.length < GuildSync.PageSize) return ids;
                after = page[page.length - 1].id;
            }
        } catch (error) {
            client.logger.error('[protection] Could not list the guilds the bot is in, skipping the membership sync', error);
            return undefined;
        }
    }
}

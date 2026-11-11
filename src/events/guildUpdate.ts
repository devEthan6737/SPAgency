import { createEvent } from 'seyfert';
import { GuildRepository } from '../database/repositories/guild.repository.js';

/**
 * Fires when a guild's settings change. Only the owner matters here: `guilds.ownerId` is written once
 * at registration, so an ownership transfer would otherwise leave the old owner on record for
 * everything that reads it. Skips the write when the cached previous version shows the owner didn't change.
 */
export default createEvent({
    data: { name: 'guildUpdate' },
    async run([guild, oldGuild]) {
        if (oldGuild && oldGuild.ownerId === guild.ownerId) return;

        await GuildRepository.updateCore(guild.id, { ownerId: guild.ownerId });
    }
});

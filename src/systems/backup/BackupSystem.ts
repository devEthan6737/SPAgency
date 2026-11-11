import { AttachmentBuilder, ChannelType, OverwriteType, StickerFormatType, type APIOverwrite, type GuildChannelTypes, type GuildStructure } from 'seyfert';
import { UnnukeHelpers } from '../../commands/configuration/unnuke/shared.js';
import type { BackupSnapshot } from '../../database/repositories/backup.repository.js';
import type { backups, BackupChannel, BackupEmoji, BackupSticker } from '../../database/schema/backup.js';

type Backup = typeof backups.$inferSelect;

/** How many of each kind {@link BackupSystem.restore} actually created — everything already present by name is skipped, so these can be lower than the snapshot's totals. */
export interface RestoreCounts {
    channels: number;
    roles: number;
    bans: number;
    emojis: number;
    stickers: number;
}

/** Role ids {@link BackupSystem.restore} resolved while recreating roles: where each backed-up id ended up, and every id that exists in the guild now. */
interface RestoredRoleIds {
    remapped: Map<string, string>;
    live: Set<string>;
}

/** Snapshotting and restoring a guild's channels, roles, bans, emojis and stickers. */
export class BackupSystem {
    /**
     * Downloads an emoji or sticker image. The URLs are built from Discord's CDN, so anything else is
     * refused; the request has a timeout, follows no redirects, and stops reading past 1 MB (an emoji is
     * at most 256 KB and a sticker 512 KB) — `Content-Length` is never trusted.
     * @param url The image's URL.
     * @returns The image as base64, or `undefined` if it isn't Discord's, couldn't be fetched or was too big.
     */
    private static async downloadBase64(url: string): Promise<string | undefined> {
        const parsed = URL.canParse(url) ? new URL(url) : undefined;
        if (!parsed || parsed.protocol !== 'https:' || (parsed.hostname !== 'cdn.discordapp.com' && parsed.hostname !== 'media.discordapp.net')) return undefined;

        const response = await fetch(parsed, { signal: AbortSignal.timeout(15_000), redirect: 'error' }).catch(() => undefined);
        if (!response?.ok || !response.body) return undefined;

        const chunks: Uint8Array[] = [];
        let size = 0;
        for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
            size += chunk.length;
            if (size > 1_000_000) return undefined;

            chunks.push(chunk);
        }

        return Buffer.concat(chunks).toString('base64');
    }

    /**
     * Takes a full snapshot of `guild`'s channels (grouped by category), roles, bans, emojis and
     * stickers, ready to persist and later {@link BackupSystem.restore}. Emoji/sticker images are
     * downloaded sequentially, not in parallel, to avoid hammering Discord's CDN with a burst of
     * requests for one backup.
     */
    static async snapshot(guild: GuildStructure<'cached' | 'api'>): Promise<BackupSnapshot> {
        const [channels, roles, bans, emojis, stickers] = await Promise.all([
            guild.channels.list(),
            guild.roles.list(),
            guild.bans.list(),
            guild.emojis.list(),
            guild.stickers.list()
        ]);

        const categoryNameById = new Map(channels.filter((channel) => channel.isCategory()).map((channel) => [channel.id, channel.name]));

        const channelsCategory: BackupChannel[] = [];
        const channelsText: BackupChannel[] = [];
        const channelsNoCategory: BackupChannel[] = [];

        for (const channel of channels) {
            if (!channel.isNamed() || channel.isThread()) continue;

            const raw = await guild.client.channels.raw(channel.id);
            const parentId = 'parent_id' in raw ? raw.parent_id : undefined;

            const entry: BackupChannel = {
                name: channel.name,
                type: channel.type,
                rawPosition: 'position' in raw ? (raw.position ?? 0) : 0,
                nsfw: 'nsfw' in raw ? raw.nsfw : undefined,
                topic: 'topic' in raw ? raw.topic : undefined,
                parent: parentId ? categoryNameById.get(parentId) : undefined,
                permissionOverwrites: 'permission_overwrites' in raw ? (raw.permission_overwrites ?? []) : []
            };

            if (channel.type === ChannelType.GuildCategory) channelsCategory.push(entry);
            else if (entry.parent) channelsText.push(entry);
            else channelsNoCategory.push(entry);
        }

        const backupEmojis: BackupEmoji[] = [];
        for (const emoji of emojis) {
            if (!emoji.name) continue;
            const image = await BackupSystem.downloadBase64(emoji.url());
            if (image) backupEmojis.push({ name: emoji.name, image });
        }

        const backupStickers: BackupSticker[] = [];
        for (const sticker of stickers) {
            if (sticker.formatType === StickerFormatType.Lottie) continue;
            const ext = sticker.formatType === StickerFormatType.GIF ? 'gif' : 'png';
            const image = await BackupSystem.downloadBase64(`https://cdn.discordapp.com/stickers/${sticker.id}.${ext}`);
            if (image) backupStickers.push({ name: sticker.name, description: sticker.description ?? '', tags: sticker.tags ?? '', image });
        }

        return {
            name: guild.name,
            icon: guild.iconURL() ?? null,
            channelsCategory,
            channelsText,
            channelsNoCategory,
            roles: roles
                .filter((role) => role.id !== guild.id && !role.managed)
                .map((role) => ({
                    id: role.id,
                    name: role.name,
                    colors: role.colors,
                    hoist: role.hoist,
                    permissions: role.permissions.toString(),
                    mentionable: role.mentionable,
                    rawPosition: role.position
                })),
            bans: bans.map((ban) => ({ id: ban.user.id, reason: ban.reason ?? null })),
            emojis: backupEmojis,
            stickers: backupStickers
        };
    }

    /** Deletes channels/roles that share a name with an earlier one — cleans up raid spam before a restore. */
    static async cleanupDuplicates(guild: GuildStructure<'cached' | 'api'>) {
        const [channels, roles] = await Promise.all([guild.channels.list(), guild.roles.list()]);

        await UnnukeHelpers.deleteDuplicates(
            channels,
            (channel) => (channel.isNamed() ? channel.name : undefined),
            (channel) => guild.channels.delete(channel.id)
        );
        await UnnukeHelpers.deleteDuplicates(
            roles.filter((role) => role.id !== guild.id && !role.managed),
            (role) => role.name,
            (role) => guild.roles.delete(role.id)
        );
    }

    /**
     * Identity of a channel for "is it already there?": type, parent category name and name. Matching
     * on the name alone would treat same-named channels in different categories as one and skip them.
     */
    private static channelKey(type: ChannelType, parent: string | undefined, name: string): string {
        return `${type}\u0000${parent ?? ''}\u0000${name}`;
    }

    /**
     * Points a channel's permission overwrites at roles that exist now. The backup holds the role ids
     * from before the nuke; creating a channel with an id that no longer exists makes Discord reject
     * the whole channel. Role overwrites without a live counterpart are dropped, member overwrites and
     * `@everyone` (whose id is the guild's) are kept as they are.
     */
    private static remapOverwrites(overwrites: APIOverwrite[], guildId: string, roleIds: RestoredRoleIds): APIOverwrite[] {
        const result: APIOverwrite[] = [];

        for (const overwrite of overwrites) {
            if (overwrite.type !== OverwriteType.Role || overwrite.id === guildId) {
                result.push(overwrite);
                continue;
            }

            const id = roleIds.remapped.get(overwrite.id) ?? (roleIds.live.has(overwrite.id) ? overwrite.id : undefined);
            if (id) result.push({ ...overwrite, id });
        }

        return result;
    }

    /** Restores whatever from `backup` is missing in `guild`, matched by name. Roles go first so channel overwrites can reference them. Never deletes anything. */
    static async restore(guild: GuildStructure<'cached' | 'api'>, backup: Backup): Promise<RestoreCounts> {
        const currentRoles = await guild.roles.list();
        const roleIdByName = new Map(currentRoles.map((role) => [role.name, role.id]));
        const roleIds: RestoredRoleIds = { remapped: new Map(), live: new Set(currentRoles.map((role) => role.id)) };

        let roles = 0;
        for (const role of backup.roles) {
            let id = roleIdByName.get(role.name);

            if (!id) {
                const created = await guild.roles
                    .create({
                        name: role.name,
                        colors: {
                            primary_color: role.colors.primaryColor,
                            secondary_color: role.colors.secondaryColor,
                            tertiary_color: role.colors.tertiaryColor
                        },
                        hoist: role.hoist,
                        permissions: role.permissions,
                        mentionable: role.mentionable
                    })
                    .catch(() => undefined);
                if (created) {
                    roles++;
                    id = created.id;
                    roleIdByName.set(role.name, id);
                    roleIds.live.add(id);
                }
            }

            if (id && role.id) roleIds.remapped.set(role.id, id);
        }

        const existingChannels = await guild.channels.list();
        const categoryNameById = new Map(existingChannels.filter((channel) => channel.isCategory()).map((channel) => [channel.id, channel.name]));
        const categoryIdByName = new Map(existingChannels.filter((channel) => channel.isCategory()).map((channel) => [channel.name, channel.id]));
        const existingKeys = new Set(
            existingChannels
                .filter((channel) => channel.isNamed())
                .map((channel) => BackupSystem.channelKey(channel.type, 'parentId' in channel && channel.parentId ? categoryNameById.get(channel.parentId) : undefined, channel.name))
        );

        let channels = 0;
        for (const category of backup.channelsCategory) {
            if (existingKeys.has(BackupSystem.channelKey(ChannelType.GuildCategory, undefined, category.name))) continue;
            const created = await guild.channels
                .create({
                    type: ChannelType.GuildCategory as GuildChannelTypes,
                    name: category.name,
                    position: category.rawPosition,
                    permission_overwrites: BackupSystem.remapOverwrites(category.permissionOverwrites, guild.id, roleIds)
                })
                .catch(() => undefined);
            if (!created) continue;
            categoryIdByName.set(category.name, created.id);
            channels++;
        }

        for (const channel of [...backup.channelsText, ...backup.channelsNoCategory]) {
            if (existingKeys.has(BackupSystem.channelKey(channel.type, channel.parent, channel.name))) continue;
            const created = await guild.channels
                .create({
                    type: channel.type as GuildChannelTypes,
                    name: channel.name,
                    topic: channel.topic ?? undefined,
                    nsfw: channel.nsfw,
                    position: channel.rawPosition,
                    parent_id: channel.parent ? categoryIdByName.get(channel.parent) : undefined,
                    permission_overwrites: BackupSystem.remapOverwrites(channel.permissionOverwrites, guild.id, roleIds)
                })
                .catch(() => undefined);
            if (created) channels++;
        }

        const currentBans = new Set((await guild.bans.list()).map((ban) => ban.user.id));
        let bans = 0;
        for (const ban of backup.bans) {
            if (currentBans.has(ban.id)) continue;
            const ok = await guild.bans.create(ban.id, { reason: ban.reason ?? undefined }).then(
                () => true,
                () => false
            );
            if (ok) bans++;
        }

        const existingEmojiNames = new Set((await guild.emojis.list()).map((emoji) => emoji.name));
        let emojis = 0;
        for (const emoji of backup.emojis) {
            if (existingEmojiNames.has(emoji.name)) continue;
            const created = await guild.emojis
                .create({ name: emoji.name, image: { data: Buffer.from(emoji.image, 'base64'), type: 'buffer' } })
                .catch(() => undefined);
            if (created) emojis++;
        }

        const existingStickerNames = new Set((await guild.stickers.list()).map((sticker) => sticker.name));
        let stickers = 0;
        for (const sticker of backup.stickers) {
            if (existingStickerNames.has(sticker.name)) continue;
            const file = new AttachmentBuilder().setName(sticker.name).setFile('buffer', Buffer.from(sticker.image, 'base64'));
            const created = await guild.stickers
                .create({ name: sticker.name, description: sticker.description, tags: sticker.tags, file })
                .catch(() => undefined);
            if (created) stickers++;
        }

        return { channels, roles, bans, emojis, stickers };
    }
}

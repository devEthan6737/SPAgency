import { AttachmentBuilder, ChannelType, StickerFormatType, type GuildChannelTypes, type GuildStructure } from 'seyfert';
import { UnnukeHelpers } from '../../commands/configuration/unnuke/shared.js';
import type { BackupSnapshot } from '../../database/repositories/backup.repository.js';
import type { backups, BackupChannel, BackupEmoji, BackupSticker } from '../../database/schema/backup.js';

type Backup = typeof backups.$inferSelect;

export interface RestoreCounts {
    channels: number;
    roles: number;
    bans: number;
    emojis: number;
    stickers: number;
}

/** Snapshotting and restoring a guild's channels, roles, bans, emojis and stickers. */
export class BackupSystem {
    /** Downloads `url` and returns it as a base64 string, or undefined if it couldn't be fetched. */
    private static async downloadBase64(url: string): Promise<string | undefined> {
        const response = await fetch(url).catch(() => undefined);
        if (!response?.ok) return undefined;
        return Buffer.from(await response.arrayBuffer()).toString('base64');
    }

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

    /** Restores whatever from `backup` is missing in `guild`, matched by name. Never deletes anything. */
    static async restore(guild: GuildStructure<'cached' | 'api'>, backup: Backup): Promise<RestoreCounts> {
        const existingChannels = await guild.channels.list();
        const existingNames = new Set(existingChannels.filter((channel) => channel.isNamed()).map((channel) => channel.name));
        const categoryIdByName = new Map(existingChannels.filter((channel) => channel.isCategory()).map((channel) => [channel.name, channel.id]));

        let channels = 0;
        for (const category of backup.channelsCategory) {
            if (existingNames.has(category.name)) continue;
            const created = await guild.channels
                .create({
                    type: ChannelType.GuildCategory as GuildChannelTypes,
                    name: category.name,
                    position: category.rawPosition,
                    permission_overwrites: category.permissionOverwrites
                })
                .catch(() => undefined);
            if (!created) continue;
            categoryIdByName.set(category.name, created.id);
            channels++;
        }

        for (const channel of [...backup.channelsText, ...backup.channelsNoCategory]) {
            if (existingNames.has(channel.name)) continue;
            const created = await guild.channels
                .create({
                    type: channel.type as GuildChannelTypes,
                    name: channel.name,
                    topic: channel.topic ?? undefined,
                    nsfw: channel.nsfw,
                    position: channel.rawPosition,
                    parent_id: channel.parent ? categoryIdByName.get(channel.parent) : undefined,
                    permission_overwrites: channel.permissionOverwrites
                })
                .catch(() => undefined);
            if (created) channels++;
        }

        const existingRoleNames = new Set((await guild.roles.list()).map((role) => role.name));
        let roles = 0;
        for (const role of backup.roles) {
            if (existingRoleNames.has(role.name)) continue;
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
            if (created) roles++;
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

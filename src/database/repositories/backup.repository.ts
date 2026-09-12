import { eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { backups, type BackupBan, type BackupChannel, type BackupEmoji, type BackupRole, type BackupSticker } from '../schema/backup.js';

/** Shape of a guild snapshot as taken by `/backup create` — everything `backups` stores except the guild id. */
export interface BackupSnapshot {
    name: string;
    icon: string | null;
    channelsCategory: BackupChannel[];
    channelsText: BackupChannel[];
    channelsNoCategory: BackupChannel[];
    roles: BackupRole[];
    bans: BackupBan[];
    emojis: BackupEmoji[];
    stickers: BackupSticker[];
}

/** Static-method repository for the `backups` table — one row per guild. */
export class BackupRepository {
    /**
     * Fetches the guild's stored backup, if any.
     * @param guildId Guild to look up.
     * @returns The backup row, or `undefined` if the guild has none.
     */
    static async get(guildId: string) {
        const [row] = await db.select().from(backups).where(eq(backups.guildId, guildId));
        return row;
    }

    /** Replaces any existing snapshot for the guild — there's only ever one per server. */
    static save(guildId: string, snapshot: BackupSnapshot) {
        return db
            .insert(backups)
            .values({ guildId, ...snapshot })
            .onConflictDoUpdate({ target: backups.guildId, set: { ...snapshot, createdAt: new Date() } })
            .returning();
    }

    /**
     * Deletes the guild's stored backup, if any.
     * @param guildId Guild whose backup should be removed.
     * @returns The deleted row(s).
     */
    static delete(guildId: string) {
        return db.delete(backups).where(eq(backups.guildId, guildId)).returning();
    }
}

import { eq } from 'drizzle-orm';
import { db } from '../connection.js';
import { backups, type BackupBan, type BackupChannel, type BackupEmoji, type BackupRole, type BackupSticker } from '../schema/backup.js';

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

export class BackupRepository {
    static get(guildId: string) {
        return db
            .select()
            .from(backups)
            .where(eq(backups.guildId, guildId))
            .then(([row]) => row);
    }

    /** Replaces any existing snapshot for the guild — there's only ever one per server. */
    static save(guildId: string, snapshot: BackupSnapshot) {
        return db
            .insert(backups)
            .values({ guildId, ...snapshot })
            .onConflictDoUpdate({ target: backups.guildId, set: { ...snapshot, createdAt: new Date() } })
            .returning();
    }

    static delete(guildId: string) {
        return db.delete(backups).where(eq(backups.guildId, guildId)).returning();
    }
}

import type { APIBan, APIOverwrite, APIRole, ChannelType } from 'seyfert';

export interface BackupChannel {
    name: string;
    type: ChannelType;
    rawPosition: number;
    nsfw?: boolean;
    topic?: string | null;
    parent?: string;
    permissionOverwrites: APIOverwrite[];
}

export interface BackupRole extends Pick<APIRole, 'name' | 'color' | 'hoist' | 'permissions' | 'mentionable'> {
    rawPosition: number;
}

export interface BackupBan extends Pick<APIBan, 'reason'> {
    id: string;
}

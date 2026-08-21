import { EmbedColors, type SeyfertLocale } from 'seyfert';
import { serverEventLogs, ServerEventType } from '../../../database/schema/server-event-log.js';
import { Log } from '../Log.js';

/** Logged when a member leaves the guild. */
export class MemberLeaveLog extends Log<ServerEventType, typeof serverEventLogs> {
    readonly type = ServerEventType.MemberLeave;

    /** @param userId - Id of the member who left. */
    constructor(guildId: string, userId: string) {
        super(guildId, userId);
    }

    protected getColor() {
        return EmbedColors.Orange;
    }

    protected getDescription(t: SeyfertLocale) {
        return t.systems.logs.events.memberLeave(this.targetId!).get();
    }

    protected getTable() {
        return serverEventLogs;
    }

    protected toRow() {
        return {
            guildId: this.guildId,
            type: this.type,
            targetId: this.targetId,
            createdAt: this.createdAt
        };
    }
}

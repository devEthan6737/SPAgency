import { EmbedColors, type SeyfertLocale } from 'seyfert';
import { serverEventLogs, ServerEventType } from '../../../database/schema/server-event-log.js';
import { Log } from '../Log.js';

/** Logged when a member joins the guild. */
export class MemberJoinLog extends Log<ServerEventType, typeof serverEventLogs> {
    readonly type = ServerEventType.MemberJoin;
    readonly accountCreatedAt: Date;

    /**
     * @param userId - Id of the member who joined.
     * @param accountCreatedAt - When the member's Discord account was created.
     */
    constructor(guildId: string, userId: string, accountCreatedAt: Date) {
        super(guildId, userId);
        this.accountCreatedAt = accountCreatedAt;
    }

    protected getColor() {
        return EmbedColors.Green;
    }

    protected getDescription(t: SeyfertLocale) {
        return t.systems.logs.events.memberJoin(this.targetId!).get();
    }

    protected getTable() {
        return serverEventLogs;
    }

    protected toRow() {
        return {
            guildId: this.guildId,
            type: this.type,
            targetId: this.targetId,
            data: { accountCreatedAt: this.accountCreatedAt.toISOString() },
            createdAt: this.createdAt
        };
    }
}

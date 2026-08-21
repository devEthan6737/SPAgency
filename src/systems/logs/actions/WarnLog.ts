import { EmbedColors, type SeyfertLocale } from 'seyfert';
import { botActionLogs, BotActionType } from '../../../database/schema/bot-action-log.js';
import { Log } from '../Log.js';

/** Logged when a member is warned through the bot. */
export class WarnLog extends Log<BotActionType, typeof botActionLogs> {
    readonly type = BotActionType.Warn;
    readonly executorId: string;
    readonly reason: string;

    /**
     * @param userId - Id of the warned member.
     * @param executorId - Id of the staff member who issued the warning.
     * @param reason - Warning reason.
     */
    constructor(guildId: string, userId: string, executorId: string, reason: string) {
        super(guildId, userId);
        this.executorId = executorId;
        this.reason = reason;
    }

    protected getColor() {
        return EmbedColors.Yellow;
    }

    protected getDescription(t: SeyfertLocale) {
        return t.systems.logs.actions.warn(this.targetId!, this.reason).get();
    }

    protected getTable() {
        return botActionLogs;
    }

    protected toRow() {
        return {
            guildId: this.guildId,
            type: this.type,
            targetId: this.targetId,
            executorId: this.executorId,
            reason: this.reason,
            createdAt: this.createdAt
        };
    }
}

import { EmbedColors, type SeyfertLocale } from 'seyfert';
import { botActionLogs, BotActionType } from '../../../database/schema/bot-action-log.js';
import { Log } from '../Log.js';

/** Logged when a member is banned through the bot. */
export class BanLog extends Log<BotActionType, typeof botActionLogs> {
    readonly type = BotActionType.Ban;
    readonly executorId: string;
    readonly reason?: string;

    /**
     * @param userId - Id of the banned member.
     * @param executorId - Id of the staff member (or `'system'` for automated protections) who requested the ban.
     * @param reason - Ban reason, if any.
     */
    constructor(guildId: string, userId: string, executorId: string, reason?: string) {
        super(guildId, userId);
        this.executorId = executorId;
        this.reason = reason;
    }

    protected getColor() {
        return EmbedColors.Red;
    }

    protected getDescription(t: SeyfertLocale) {
        return t.systems.logs.actions.ban(this.targetId!, this.reason).get();
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

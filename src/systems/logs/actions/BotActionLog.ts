import type { EmbedColors, SeyfertLocale } from 'seyfert';
import { botActionLogs, BotActionType } from '../../../database/schema/bot-action-log.js';
import { Log } from '../Log.js';

export interface BotActionLogInput {
    type: BotActionType;
    color: EmbedColors;
    /** Builds the log line in the guild's configured language — deferred, not the invoker's own locale. */
    describe: (t: SeyfertLocale) => string;
    targetId?: string;
    executorId?: string;
    reason?: string;
    /** Extra data specific to this action, e.g. `{ minutes }` for a timeout. */
    data?: Record<string, unknown>;
}

/**
 * One log entry for any action the bot performed (ban, warn, backup...). No per-type table to keep
 * in sync here — the caller already knows its own color and description (it builds the same things
 * for its own reply embed), so it just hands them over.
 */
export class BotActionLog extends Log<BotActionType, typeof botActionLogs> {
    readonly type: BotActionType;

    constructor(
        guildId: string,
        private readonly input: BotActionLogInput
    ) {
        super(guildId, input.targetId);
        this.type = input.type;
    }

    protected getColor() {
        return this.input.color;
    }

    protected getDescription(t: SeyfertLocale) {
        return this.input.describe(t);
    }

    protected getTable() {
        return botActionLogs;
    }

    protected toRow() {
        return {
            guildId: this.guildId,
            type: this.type,
            targetId: this.input.targetId,
            executorId: this.input.executorId,
            reason: this.input.reason,
            data: this.input.data,
            createdAt: this.createdAt
        };
    }
}

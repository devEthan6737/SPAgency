import { AuditLogEvent, EmbedColors, type SeyfertLocale } from 'seyfert';
import { serverEventLogs, ServerEventType } from '../../../database/schema/server-event-log.js';
import { Log } from '../Log.js';

interface AuditLogEventTemplate {
    type: ServerEventType;
    color: EmbedColors;
    describe: (t: SeyfertLocale, targetId?: string) => string;
}

/**
 * How each audit-log-driven server event renders — one entry per action, no branching. Actions the
 * bot doesn't log (member-related ones, mainly) are simply absent, not a `default` case.
 */
const AUDIT_LOG_EVENT_TEMPLATES: Partial<Record<AuditLogEvent, AuditLogEventTemplate>> = {
    [AuditLogEvent.ChannelCreate]: {
        type: ServerEventType.ChannelCreate,
        color: EmbedColors.Green,
        describe: (t, id) => t.systems.logs.events.channelCreate(id!).get()
    },
    [AuditLogEvent.ChannelDelete]: {
        type: ServerEventType.ChannelDelete,
        color: EmbedColors.Red,
        describe: (t, id) => t.systems.logs.events.channelDelete(id!).get()
    },
    [AuditLogEvent.ChannelUpdate]: {
        type: ServerEventType.ChannelUpdate,
        color: EmbedColors.Yellow,
        describe: (t, id) => t.systems.logs.events.channelUpdate(id!).get()
    },
    [AuditLogEvent.RoleCreate]: {
        type: ServerEventType.RoleCreate,
        color: EmbedColors.Green,
        describe: (t, id) => t.systems.logs.events.roleCreate(id!).get()
    },
    [AuditLogEvent.RoleDelete]: {
        type: ServerEventType.RoleDelete,
        color: EmbedColors.Red,
        describe: (t, id) => t.systems.logs.events.roleDelete(id!).get()
    },
    [AuditLogEvent.WebhookCreate]: {
        type: ServerEventType.WebhookCreate,
        color: EmbedColors.Yellow,
        describe: (t) => t.systems.logs.events.webhookCreate().get()
    }
};

export interface ServerEventLogInput {
    type: ServerEventType;
    color: EmbedColors;
    /** Builds the log line in the guild's configured language — deferred, not the invoker's own locale. */
    describe: (t: SeyfertLocale) => string;
    targetId?: string;
    /** Extra data specific to this event, e.g. `{ accountCreatedAt }` for a join. */
    data?: Record<string, unknown>;
}

/**
 * One log entry for anything that happened in the guild, regardless of who caused it (a member,
 * another bot, or a manual action in Discord's UI) — as opposed to {@link BotActionLog}, which is
 * only for actions this bot took on request. Same shape for the same reason: the caller already
 * knows its own color and description, so it just hands them over.
 */
export class ServerEventLog extends Log<ServerEventType, typeof serverEventLogs> {
    readonly type: ServerEventType;

    constructor(
        guildId: string,
        private readonly input: ServerEventLogInput
    ) {
        super(guildId, input.targetId);
        this.type = input.type;
    }

    /** Builds the log for a `guildAuditLogEntryCreate` entry, or `undefined` if this action isn't logged. */
    static fromAuditLogEntry(guildId: string, actionType: AuditLogEvent, targetId?: string): ServerEventLog | undefined {
        const template = AUDIT_LOG_EVENT_TEMPLATES[actionType];
        if (!template) return undefined;

        return new ServerEventLog(guildId, {
            type: template.type,
            color: template.color,
            describe: (t) => template.describe(t, targetId),
            targetId
        });
    }

    protected getColor() {
        return this.input.color;
    }

    protected getDescription(t: SeyfertLocale) {
        return this.input.describe(t);
    }

    protected getTable() {
        return serverEventLogs;
    }

    protected toRow() {
        return {
            guildId: this.guildId,
            type: this.type,
            targetId: this.input.targetId,
            data: this.input.data,
            createdAt: this.createdAt
        };
    }
}

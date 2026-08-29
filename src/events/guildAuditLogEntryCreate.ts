import { AuditLogEvent, createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';
import { dispatchLog, ServerEventLog } from '../systems/logs/index.js';

/** Audit log actions the antiraid burst detector cares about. */
const FLAGGED_ACTIONS = new Set<AuditLogEvent>([
    AuditLogEvent.ChannelCreate,
    AuditLogEvent.ChannelDelete,
    AuditLogEvent.ChannelUpdate,
    AuditLogEvent.RoleCreate,
    AuditLogEvent.RoleDelete,
    AuditLogEvent.MemberBanAdd
]);

/**
 * Seyfert only keeps one handler per event name — a second `createEvent({ data: { name:
 * 'guildAuditLogEntryCreate' } })` elsewhere would silently replace this one, not run alongside it.
 * Any future audit-log-driven feature has to be added here, not in a separate file. Keep the
 * antiraid check first (or unawaited/parallel) so it's never delayed by whatever else runs here.
 */
export default createEvent({
    data: { name: 'guildAuditLogEntryCreate' },
    async run(entry, client) {
        if (entry.userId && FLAGGED_ACTIONS.has(entry.actionType)) {
            await AntiraidSystem.detect({ client, guildId: entry.guildId, executorId: entry.userId });
        }

        if (entry.userId === client.botId) return;

        const log = ServerEventLog.fromAuditLogEntry(entry.guildId, entry.actionType, entry.targetId ?? undefined);
        if (!log) return;

        void dispatchLog(client, log).catch(() => {});
    }
});

import { AuditLogEvent, createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';
import { dispatchLog, ServerEventLog } from '../systems/logs/index.js';
import { RaidmodeSystem } from '../systems/raidmode/index.js';

/** Audit log actions the antiraid burst detector cares about. */
const FLAGGED_ACTIONS = new Set<AuditLogEvent>([
    AuditLogEvent.ChannelCreate,
    AuditLogEvent.ChannelDelete,
    AuditLogEvent.ChannelUpdate,
    AuditLogEvent.RoleCreate,
    AuditLogEvent.RoleDelete,
    AuditLogEvent.MemberBanAdd,
    AuditLogEvent.MemberBanRemove
]);

/**
 * Seyfert only keeps one handler per event name — a second `createEvent({ data: { name:
 * 'guildAuditLogEntryCreate' } })` elsewhere would silently replace this one, not run alongside it.
 * Any future audit-log-driven feature has to be added here, not in a separate file. `RaidmodeSystem`
 * runs first and, while active, substitutes for antiraid and normal event logging entirely (see
 * docs/raidmode.md) — only once it passes do the antiraid check and the general log dispatch happen.
 */
export default createEvent({
    data: { name: 'guildAuditLogEntryCreate' },
    async run(entry, client) {
        if (entry.userId &&
            (
                await RaidmodeSystem.enforceAuditEntry(client, {
                    guildId: entry.guildId,
                    userId: entry.userId,
                    actionType: entry.actionType
                })
            )
        ) return;

        if (entry.userId && FLAGGED_ACTIONS.has(entry.actionType)) {
            const weight = await AntiraidSystem.weightFor(client, entry);
            await AntiraidSystem.detect({ client, guildId: entry.guildId, executorId: entry.userId, weight });
        }

        if (entry.userId === client.botId) return;

        const log = ServerEventLog.fromAuditLogEntry(entry.guildId, entry.actionType, entry.targetId ?? undefined);
        if (!log) return;

        void dispatchLog(client, log).catch(() => {});
    }
});

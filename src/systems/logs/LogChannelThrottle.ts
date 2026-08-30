import type { Embed } from 'seyfert';

interface GuildQueue {
    /** Timestamps of recent sends, pruned to the last {@link LogChannelThrottle.WindowMs}. */
    sentAt: number[];
    queue: Embed[];
    flushTimer?: NodeJS.Timeout;
    /** Drops this entry from the map once nothing has happened for a whole window — see {@link LogChannelThrottle.scheduleReap}. */
    reapTimer?: NodeJS.Timeout;
}

/**
 * Caps how often a guild's log channel actually receives a message during a burst (a raid, a bulk
 * action...), without dropping anything — logs still always persist to the DB via `log.save()`
 * regardless of this. Queued embeds get bundled into one message (up to
 * {@link LogChannelThrottle.MaxEmbedsPerMessage}) once the window allows sending again, instead of
 * being lost.
 */
export class LogChannelThrottle {
    /** How many messages a guild's log channel accepts within the window before extra embeds get queued instead. */
    private static readonly MaxSendsPerWindow = 3;
    /** Rolling window in ms — see {@link LogChannelThrottle.MaxSendsPerWindow}. */
    private static readonly WindowMs = 10_000;
    /** Discord's own limit — not ours to tune. */
    private static readonly MaxEmbedsPerMessage = 10;

    private static guilds = new Map<string, GuildQueue>();

    /**
     * Registers one embed for `guildId`. Calls `send` right away if the guild still has budget in
     * the current window, or queues the embed and calls `send` later with a batch once it does —
     * possibly more than once, if the queue outgrows one message.
     */
    static submit(guildId: string, embed: Embed, send: (embeds: Embed[]) => Promise<void>): void {
        const entry = LogChannelThrottle.guilds.get(guildId) ?? { sentAt: [], queue: [] };
        LogChannelThrottle.guilds.set(guildId, entry);

        const now = Date.now();
        entry.sentAt = entry.sentAt.filter((sentAt) => now - sentAt < LogChannelThrottle.WindowMs);

        if (entry.queue.length === 0 && entry.sentAt.length < LogChannelThrottle.MaxSendsPerWindow) {
            entry.sentAt.push(now);
            void send([embed]).catch(() => {});
            LogChannelThrottle.scheduleReap(guildId);
            return;
        }

        entry.queue.push(embed);
        LogChannelThrottle.scheduleFlush(guildId, send);
    }

    private static scheduleFlush(guildId: string, send: (embeds: Embed[]) => Promise<void>): void {
        const entry = LogChannelThrottle.guilds.get(guildId);
        if (!entry || entry.flushTimer) return;

        const oldestInWindow = entry.sentAt[0] ?? Date.now();
        const delay = Math.max(0, LogChannelThrottle.WindowMs - (Date.now() - oldestInWindow));

        entry.flushTimer = setTimeout(() => {
            entry.flushTimer = undefined;

            const batch = entry.queue.splice(0, LogChannelThrottle.MaxEmbedsPerMessage);
            if (batch.length === 0) return;

            entry.sentAt.push(Date.now());
            void send(batch).catch(() => {});

            if (entry.queue.length > 0) LogChannelThrottle.scheduleFlush(guildId, send);
            else LogChannelThrottle.scheduleReap(guildId);
        }, delay);
    }

    /** Deletes a guild's entry once a full window passes with nothing sent or queued — otherwise every guild that ever logs once keeps a `Map` entry forever. */
    private static scheduleReap(guildId: string): void {
        const entry = LogChannelThrottle.guilds.get(guildId);
        if (!entry) return;

        if (entry.reapTimer) clearTimeout(entry.reapTimer);
        entry.reapTimer = setTimeout(() => {
            const current = LogChannelThrottle.guilds.get(guildId);
            if (!current) return;

            current.sentAt = current.sentAt.filter((sentAt) => Date.now() - sentAt < LogChannelThrottle.WindowMs);
            if (current.sentAt.length === 0 && current.queue.length === 0 && !current.flushTimer) {
                LogChannelThrottle.guilds.delete(guildId);
            }
        }, LogChannelThrottle.WindowMs);
    }
}

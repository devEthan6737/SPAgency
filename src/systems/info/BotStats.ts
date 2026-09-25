import type { UsingClient } from 'seyfert';

/** The live numbers `/info` shows about the running bot. */
export interface BotStatsSnapshot {
    /** Servers the bot is in. */
    guilds: number;
    /** Members across those servers, each counted once per server (not distinct users). */
    users: number;
    /** Commands registered. */
    commands: number;
    /** CPU the process used during the sampling window, as a percentage of one core. */
    cpuPercent: number;
    /** Resident memory of the process, in megabytes. */
    ramMb: number;
}

/** The numbers of {@link BotStatsSnapshot} that reach the locale as plain values, uptime already spelled out. */
export interface InfoStatsText {
    guilds: number;
    users: number;
    commands: number;
    uptime: string;
}

/** Reads the bot's size and resource use for `/info`. */
export class BotStats {
    /** How long CPU use is measured for; a single reading of the process's counters would only give a lifetime average. */
    private static readonly CpuWindowMs = 500;

    /**
     * Collects the snapshot. Takes about half a second, the CPU sampling window.
     * @param client The client, for its guild cache and command list.
     * @returns The current numbers.
     */
    static async collect(client: UsingClient): Promise<BotStatsSnapshot> {
        const cpuPercent = BotStats.sampleCpu(BotStats.CpuWindowMs);
        const guilds = (await client.cache.guilds?.values()) ?? [];

        return {
            guilds: guilds.length,
            users: guilds.reduce((total, guild) => total + (guild.memberCount ?? 0), 0),
            commands: client.commands.values.length,
            cpuPercent: await cpuPercent,
            ramMb: process.memoryUsage().rss / 1_048_576
        };
    }

    /**
     * @param windowMs How long to observe the process.
     * @returns CPU time used during the window over the window's length, so 100 is one core fully busy.
     */
    private static async sampleCpu(windowMs: number): Promise<number> {
        const startUsage = process.cpuUsage();
        const startTime = process.hrtime.bigint();
        await new Promise((resolve) => setTimeout(resolve, windowMs));

        const used = process.cpuUsage(startUsage);
        const elapsedMicros = Number(process.hrtime.bigint() - startTime) / 1_000;

        return ((used.user + used.system) / elapsedMicros) * 100;
    }
}

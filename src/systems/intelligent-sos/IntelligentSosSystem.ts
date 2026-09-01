import { ChannelType, type TextGuildChannelStructure, type UsingClient } from 'seyfert';
import { GuildConfigCache } from '../protection/index.js';

/** @see IntelligentSosSystem.sendAlert */
export type SendAlertResult = 'sent' | 'noStaffChannel' | 'noInviteChannel';

/**
 * Pings SPAgency staff with a fresh invite, for both the manual `/sos` command and automatic
 * escalation from detection systems — see docs/intelligent-sos.md.
 */
export class IntelligentSosSystem {
    /** Cooldown between automatic alerts for the same guild, so a repeating trigger doesn't flood the staff channel. */
    private static cooldowns = new Map<string, NodeJS.Timeout>();

    /**
     * The automatic entry point — call this from a detection system when something serious enough
     * happens that staff should know. Gated by `intelligentSosEnable` and a per-guild cooldown, both
     * checked before anything that touches the network: the cooldown is a plain `Map.get()` (checked
     * first, zero cost), `GuildConfigCache.get()` is a cache hit in the common case but still an
     * `async` call, so it only runs once the cheaper check has already passed.
     */
    static async trigger(client: UsingClient, guildId: string, reason: string): Promise<void> {
        if (IntelligentSosSystem.cooldowns.has(guildId)) return;

        const settings = await GuildConfigCache.get(guildId);
        if (!settings?.intelligentSosEnable) return;

        IntelligentSosSystem.cooldowns.set(
            guildId,
            setTimeout(() => IntelligentSosSystem.cooldowns.delete(guildId), 120_000)
        );

        await IntelligentSosSystem.sendAlert(client, guildId, reason);
    }

    /**
     * The shared mechanic: creates an invite from a random text channel and pings the staff channel
     * with it. Takes a `guildId`, not a `Guild` — nothing here needs the full structure (permission
     * calculators, etc.), just the name and the channel list, both served from cache in the common
     * case. Used directly by `/sos` (no `reason`) and by {@link IntelligentSosSystem.trigger} (with
     * one). Returns which of the two possible failures happened, if any, instead of a plain boolean —
     * `/sos` needs to tell them apart for its own error message, and this way it doesn't have to
     * re-fetch the staff channel itself just to know which one to show.
     */
    static async sendAlert(client: UsingClient, guildId: string, reason?: string): Promise<SendAlertResult> {
        const staffChannelId = process.env.STAFF_LOGS_CHANNEL;
        const staffChannel = staffChannelId ? await client.channels.fetch(staffChannelId).catch(() => undefined) : undefined;
        if (!staffChannel || !('messages' in staffChannel)) return 'noStaffChannel';

        const channels = await client.guilds.channels.list(guildId);
        const textChannels = channels.filter((channel): channel is TextGuildChannelStructure => channel.type === ChannelType.GuildText);
        const inviteChannel = textChannels[Math.floor(Math.random() * textChannels.length)];
        if (!inviteChannel) return 'noInviteChannel';

        const invite = await inviteChannel.invites.create({ max_age: 86_400 });
        const guildName = await IntelligentSosSystem.getGuildName(client, guildId);

        const settings = await GuildConfigCache.get(guildId);
        const t = client.t(settings?.language ?? 'es').systems.intelligentSos;
        const inviteUrl = `https://discord.gg/${invite.code}`;
        const content = reason ? t.automaticAlert(guildName, guildId, inviteUrl, reason).get() : t.alert(guildName, guildId, inviteUrl).get();

        await staffChannel.messages.write({ content, allowed_mentions: { parse: ['everyone'] } });
        return 'sent';
    }

    /** Raw cache read — avoids building a full `Guild` structure just to read its name. REST fallback only on a cache miss. */
    private static async getGuildName(client: UsingClient, guildId: string): Promise<string> {
        const cached = await client.cache.guilds?.raw(guildId);
        if (cached) return cached.name;

        const guild = await client.guilds.fetch(guildId).catch(() => undefined);
        return guild?.name ?? guildId;
    }
}

import { MessageType, type GuildMemberStructure, type MessageStructure, type UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import type { SupportSettings } from './SupportConfig.js';
import { SupportPosts } from './SupportPosts.js';

/** `note` is a staff message starting with `//` — never sent to the web, only kept for the staff's copy of the transcript. */
export type SupportMessageAuthor = 'staff' | 'user' | 'note';

/** A ticket message in the shape the contract with the web defines. `at` is ISO 8601. */
export interface SupportMessage {
    id: string;
    author: SupportMessageAuthor;
    name: string;
    avatar: string | null;
    content: string;
    at: string;
}

/**
 * Turns a raw channel message into a {@link SupportMessage}, or drops it. The rules are the contract's:
 * a member with the staff role is `staff` (or a `note` if the text starts with `//`), the bot's own
 * embed footed `web` is `user`, and everything else — other bots, system messages, the opening
 * message, people without the role — is ignored.
 */
export class SupportMessages {
    /** Role names by guild, kept for a few minutes — the role cache is disabled, so a name costs a REST call. */
    private static roleNames = new ExpiringMap<string, Map<string, string>>();

    /**
     * @param client Bot client.
     * @param settings Support settings — the guild and the staff role.
     * @param message Message from the ticket channel, live or read back from history.
     * @returns The normalized message, or `null` if it doesn't belong in the conversation.
     */
    static async normalize(client: UsingClient, settings: SupportSettings, message: MessageStructure): Promise<SupportMessage | null> {
        if (message.webhookId) return null;
        if (message.author.bot) return message.author.id === client.botId ? SupportMessages.fromWeb(message) : null;
        if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return null;

        const member = await SupportMessages.staffMember(client, settings, message);
        if (!member) return null;

        const t = client.t('es').systems.support.message;
        let content = await SupportMessages.readable(client, settings.guildId, message);
        if (message.attachments.length) content = `${content}\n${t.attachment.get()}`.trim();
        if (!content) return null;

        return {
            id: message.id,
            author: message.content.trimStart().startsWith('//') ? 'note' : 'staff',
            name: member.displayName,
            avatar: member.avatarURL(),
            content,
            at: message.createdAt.toISOString()
        };
    }

    /** Orders two snowflakes: negative if `a` is older, positive if newer. Compares length first, then lexically — which is numeric for digit strings of equal length. */
    static compareIds(a: string, b: string): number {
        return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
    }

    /**
     * A message the bot itself posted for the user on the web: its embed carries their name and avatar,
     * and the `web` footer is what marks it. Anything else the bot writes (the opening message) has no such footer.
     */
    private static fromWeb(message: MessageStructure): SupportMessage | null {
        const embed = message.embeds[0];
        if (embed?.footer?.text !== SupportPosts.WebFooter) return null;

        return {
            id: message.id,
            author: 'user',
            name: embed.author?.name ?? '',
            avatar: embed.author?.iconUrl ?? null,
            // The zero-width space was inserted to defuse @everyone/@here on the way in; the web should see what the user typed.
            content: (embed.description ?? '').replace(/@\u200B(everyone|here)/g, '@$1'),
            at: message.createdAt.toISOString()
        };
    }

    /**
     * The message's author as a guild member if they hold the staff role, else `null`.
     * A live message already carries its member; one read back from history doesn't, so that case
     * asks for the member (cache first) — and someone who has since left the server no longer counts.
     */
    private static async staffMember(client: UsingClient, settings: SupportSettings, message: MessageStructure): Promise<GuildMemberStructure | null> {
        const member = message.member ?? (await client.members.fetch(settings.guildId, message.author.id).catch(() => null));

        return member?.roles.keys.includes(settings.staffRoleId) ? member : null;
    }

    /**
     * The message text with Discord's markup replaced by plain text, since the web can't resolve ids:
     * `<@id>` → `@name`, `<@&id>` → `@role`, `<#id>` → `#channel`, `<:name:id>` → `:name:`.
     * Roles and channels are only looked up if the text actually mentions one, so the common case costs nothing.
     */
    private static async readable(client: UsingClient, guildId: string, message: MessageStructure): Promise<string> {
        const t = client.t('es').systems.support.message;
        let text = message.content;

        const users = new Map(message.mentions.users.map((user) => [user.id, 'displayName' in user ? user.displayName : (user.globalName ?? user.username)]));
        text = text.replace(/<@!?(\d+)>/g, (_, id: string) => `@${users.get(id) ?? t.unknownUser.get()}`);

        if (/<@&\d+>/.test(text)) {
            const roles = await SupportMessages.roles(client, guildId);
            text = text.replace(/<@&(\d+)>/g, (_, id: string) => `@${roles.get(id) ?? t.unknownRole.get()}`);
        }

        const channelIds = [...new Set([...text.matchAll(/<#(\d+)>/g)].map((match) => match[1]))];
        if (channelIds.length) {
            const channels = new Map<string, string>();
            await Promise.all(
                channelIds.map(async (id) => {
                    const channel = await client.channels.fetch(id).catch(() => null);
                    if (channel && 'name' in channel && channel.name) channels.set(id, channel.name);
                })
            );
            text = text.replace(/<#(\d+)>/g, (_, id: string) => `#${channels.get(id) ?? t.unknownChannel.get()}`);
        }

        return text.replace(/<a?:(\w+):\d+>/g, ':$1:').trim();
    }

    /** Role names of the guild, from the short-lived cache or REST. */
    private static async roles(client: UsingClient, guildId: string): Promise<Map<string, string>> {
        const cached = SupportMessages.roleNames.get(guildId);
        if (cached) return cached;

        const names = new Map((await client.roles.list(guildId, true)).map((role) => [role.id, role.name]));
        SupportMessages.roleNames.set(guildId, names, 5 * 60_000);
        return names;
    }
}

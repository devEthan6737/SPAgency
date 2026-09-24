import { MessageType, type GuildMemberStructure, type MessageStructure, type UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import type { SupportSettings } from './SupportConfig.js';
import { SupportPosts } from './SupportPosts.js';

/** `note` is a staff message starting with `//` — never sent to the web, only kept for the staff's copy of the transcript. */
export type SupportMessageAuthor = 'staff' | 'user' | 'note';

/** A ticket message in the shape the contract with the web defines. */
export interface SupportMessage {
    /** Discord message id — also the cursor the web polls with. */
    id: string;
    author: SupportMessageAuthor;
    /** Display name of whoever wrote it. */
    name: string;
    /** Avatar URL, or `null` if there is none. */
    avatar: string | null;
    /** Text with Discord's markup already turned into plain text. */
    content: string;
    /** ISO 8601 creation time. */
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
     * Normalizes one message.
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

    /**
     * Orders two snowflakes. Compares length first, then lexically — which is numeric for digit strings of equal length.
     * @param a First snowflake.
     * @param b Second snowflake.
     * @returns Negative if `a` is older, positive if it is newer, `0` if they are the same.
     */
    static compareIds(a: string, b: string): number {
        return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);
    }

    /**
     * Reads a message the bot itself posted for the user on the web: its embed carries their name and
     * avatar, and the `web` footer is what marks it. Anything else the bot writes (the opening message) has no such footer.
     * @param message A message written by the bot.
     * @returns The `user` message, or `null` if it isn't one.
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
     * Finds the message's author among the staff. A live message already carries its member; one read
     * back from history doesn't, so that case asks for the member (cache first) — and someone who has
     * since left the server no longer counts.
     * @param client Bot client.
     * @param settings Support settings — the guild and the staff role.
     * @param message The message whose author to check.
     * @returns The author as a guild member if they hold the staff role, else `null`.
     */
    private static async staffMember(client: UsingClient, settings: SupportSettings, message: MessageStructure): Promise<GuildMemberStructure | null> {
        const member = message.member ?? (await client.members.fetch(settings.guildId, message.author.id).catch(() => null));

        return member?.roles.keys.includes(settings.staffRoleId) ? member : null;
    }

    /**
     * Replaces Discord's markup with plain text, since the web can't resolve ids:
     * `<@id>` → `@name`, `<@&id>` → `@role`, `<#id>` → `#channel`, `<:name:id>` → `:name:`.
     * Roles and channels are only looked up if the text actually mentions one, so the common case costs nothing.
     * @param client Bot client.
     * @param guildId Guild whose roles and channels the ids refer to.
     * @param message The message whose text to convert.
     * @returns The converted, trimmed text.
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

    /**
     * Role names of a guild, from the short-lived cache or REST.
     * @param client Bot client.
     * @param guildId The guild whose roles to name.
     * @returns Role name by role id.
     */
    private static async roles(client: UsingClient, guildId: string): Promise<Map<string, string>> {
        const cached = SupportMessages.roleNames.get(guildId);
        if (cached) return cached;

        const names = new Map((await client.roles.list(guildId, true)).map((role) => [role.id, role.name]));
        SupportMessages.roleNames.set(guildId, names, { ttlMs: 5 * 60_000 });
        return names;
    }
}

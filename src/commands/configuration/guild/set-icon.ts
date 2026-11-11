import { lookup, type LookupAddress } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import { createStringOption, Declare, EmbedColors, LocalesT, Options, SubCommand, type CommandContext } from 'seyfert';
import { BotActionType } from '../../../database/schema/bot-action-log.js';
import { BotActionLog, dispatchLog } from '../../../systems/logs/index.js';

const options = {
    url: createStringOption({
        description: 'Link to the new icon image.',
        required: true,
        locales: {
            name: 'commands.configuration.guild.setIcon.option.url.name',
            description: 'commands.configuration.guild.setIcon.option.url.description'
        }
    })
};

@Declare({
    name: 'set-icon',
    description: "Changes the server's icon.",
    botPermissions: ['ManageGuild'],
    defaultMemberPermissions: ['ManageGuild']
})

@LocalesT('commands.configuration.guild.setIcon.name', 'commands.configuration.guild.setIcon.description')

@Options(options)

/**
 * Changes the server's icon from a user-supplied image URL. Requires `ManageGuild`.
 *
 * The URL is downloaded under an SSRF guard (see {@link SetIconSubCommand.urlToDataUri}): only
 * `http`/`https`, the address the socket connects to checked against private/loopback/link-local
 * ranges at connect time (so DNS rebinding can't swap it afterwards), no redirects, a timeout, and a
 * size cap enforced on the real stream rather than trusting `Content-Length`.
 */
export default class SetIconSubCommand extends SubCommand {
    private static readonly MaxBytes = 8 * 1024 * 1024;

    /** True for loopback/private/link-local addresses (incl. cloud metadata hosts like 169.254.169.254). */
    private static isPrivateIp(ip: string): boolean {
        if (ip.includes(':')) {
            const lower = ip.toLowerCase();
            if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true;
            if (lower.startsWith('::ffff:')) {
                const embedded = lower.slice(7);
                if (isIP(embedded)) return SetIconSubCommand.isPrivateIp(embedded);
            }
            return false;
        }

        const [a, b] = ip.split('.').map(Number);
        return (
            a === 127 || // loopback
            a === 10 || // 10.0.0.0/8
            (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
            (a === 192 && b === 168) || // 192.168.0.0/16
            (a === 169 && b === 254) || // link-local, incl. cloud metadata
            (a === 100 && b >= 64 && b <= 127) || // CGNAT
            a === 0
        );
    }

    /**
     * Rejects an IP-literal host that is private; names are validated at connect time instead, see {@link SetIconSubCommand.safeLookup}.
     * @param hostname The URL's hostname, with the brackets of an IPv6 literal if it has them.
     * @throws {Error} If the host is a private, loopback or link-local address.
     */
    private static assertPublicLiteral(hostname: string) {
        const literal = hostname.startsWith('[') ? hostname.slice(1, -1) : hostname;
        if (isIP(literal) && SetIconSubCommand.isPrivateIp(literal)) throw new Error('Blocked private address.');
    }

    /**
     * DNS lookup used for the connection itself, refusing private addresses. Checking the host before
     * `fetch` and letting it resolve again would leave a window for DNS rebinding (public answer first,
     * private one second); validating the very address the socket connects to has no such window.
     */
    private static safeLookup: LookupFunction = (hostname, options, callback) => {
        lookup(hostname, { ...options, all: true }, (error, addresses) => {
            if (error) return callback(error, '', 4);
            if (addresses.some((entry) => SetIconSubCommand.isPrivateIp(entry.address))) return callback(new Error('Blocked private address.'), '', 4);

            if (options.all) return (callback as unknown as (error: null, addresses: LookupAddress[]) => void)(null, addresses);
            callback(null, addresses[0].address, addresses[0].family);
        });
    };

    /** Downloads `url` and returns it as a base64 data URI, guarding against SSRF and oversized/never-ending responses. */
    private static urlToDataUri(url: string): Promise<string> {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return Promise.reject(new Error('Only http/https URLs are allowed.'));
        SetIconSubCommand.assertPublicLiteral(parsed.hostname);

        return new Promise((resolve, reject) => {
            const request = (parsed.protocol === 'https:' ? https : http).get(parsed, { lookup: SetIconSubCommand.safeLookup, timeout: 10_000 }, (response) => {
                const contentType = response.headers['content-type'] ?? '';
                if (response.statusCode !== 200) return fail(new Error('Could not download that image.'));
                if (!contentType.startsWith('image/')) return fail(new Error('That URL is not an image.'));

                const chunks: Buffer[] = [];
                let total = 0;
                response.on('data', (chunk: Buffer) => {
                    total += chunk.length;
                    if (total > SetIconSubCommand.MaxBytes) return fail(new Error('That image is too large.'));
                    chunks.push(chunk);
                });
                response.on('end', () => resolve(`data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`));
                response.on('error', fail);

                function fail(error: Error) {
                    request.destroy();
                    reject(error);
                }
            });

            request.on('timeout', () => request.destroy(new Error('The download timed out.')));
            request.on('error', reject);
        });
    }

    /** Downloads the given URL as a data URI (via the SSRF-guarded {@link SetIconSubCommand.urlToDataUri}) and applies it as the guild icon. */
    async run(ctx: CommandContext<typeof options>) {
        if (!ctx.inGuild()) return;
        const t = ctx.t.commands.configuration.guild.setIcon;

        let dataUri: string;
        try {
            dataUri = await SetIconSubCommand.urlToDataUri(ctx.options.url);
        } catch {
            await ctx.write({ content: t.invalidUrl.get() });
            return;
        }

        const guild = await ctx.guild();
        await guild.edit({ icon: dataUri });
        
        void dispatchLog(ctx.client, SetIconSubCommand.log({ guildId: guild.id, executorId: ctx.author.id })).catch(() => {});
        await ctx.write({ content: t.done.get() });
    }

    /** Builds the {@link BotActionLog} entry recording the icon change. */
    private static log({ guildId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.SetIcon,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.setIcon().get(),
            executorId
        });
    }
}

/** Input for {@link SetIconSubCommand.log}. */
interface LogInput {
    guildId: string;
    executorId: string;
}

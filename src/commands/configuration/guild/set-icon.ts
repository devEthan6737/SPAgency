import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
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

export default class SetIconSubCommand extends SubCommand {
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

    private static async assertPublicHost(hostname: string) {
        const targets = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((entry) => entry.address);
        if (targets.some(SetIconSubCommand.isPrivateIp)) throw new Error('Blocked private address.');
    }

    /** Downloads `url` and returns it as a base64 data URI, guarding against SSRF and oversized/never-ending responses. */
    private static async urlToDataUri(url: string): Promise<string> {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Only http/https URLs are allowed.');
        await SetIconSubCommand.assertPublicHost(parsed.hostname);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        try {
            const response = await fetch(parsed, { signal: controller.signal, redirect: 'error' });
            if (!response.ok || !response.body) throw new Error('Could not download that image.');

            const contentType = response.headers.get('content-type') ?? '';
            if (!contentType.startsWith('image/')) throw new Error('That URL is not an image.');

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let total = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                total += value.length;
                if (total > 8 * 1024 * 1024) {
                    await reader.cancel();
                    throw new Error('That image is too large.');
                }
                chunks.push(value);
            }

            return `data:${contentType};base64,${Buffer.concat(chunks).toString('base64')}`;
        } finally {
            clearTimeout(timeout);
        }
    }

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

    private static log({ guildId, executorId }: LogInput) {
        return new BotActionLog(guildId, {
            type: BotActionType.SetIcon,
            color: EmbedColors.Blurple,
            describe: (t) => t.systems.logs.actions.setIcon().get(),
            executorId
        });
    }
}

interface LogInput {
    guildId: string;
    executorId: string;
}

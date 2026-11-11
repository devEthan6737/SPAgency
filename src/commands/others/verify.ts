import { Cooldown } from '@slipher/cooldown';
import { Command, Declare, LocalesT, MessageFlags, type CommandContext } from 'seyfert';
import { GuildConfigCache } from '../../systems/protection/index.js';
import { VerificationSystem } from '../../systems/verification/index.js';

@Declare({
    name: 'verify',
    description: 'Sends you a fresh verification link by DM.',
    props: { category: 'others' }
})

@LocalesT('commands.others.verify.name', 'commands.others.verify.description')

@Cooldown.user(60_000)

/**
 * Reissues the verification link for a member who never got the join-time DM (closed DMs) or let its
 * 15 minutes run out. Only answers to the invoker, and only while the server has verification on and
 * the member doesn't already hold its role.
 */
export default class VerifyCommand extends Command {
    /** Checks verification is on and the member isn't verified yet, then DMs a fresh link via `VerificationSystem.sendLink`. */
    async run(ctx: CommandContext) {
        if (!ctx.inGuild()) return;

        const t = ctx.t.commands.others.verify;
        const reply = (content: string) => ctx.write({ content, flags: MessageFlags.Ephemeral });

        const settings = await GuildConfigCache.get(ctx.guildId);
        if (!settings?.verificationEnable || !settings.verificationRole) return await reply(t.notEnabled.get());
        if (ctx.member.roles.keys.includes(settings.verificationRole)) return await reply(t.alreadyVerified.get());

        const result = await VerificationSystem.sendLink(ctx.client, ctx.member);
        if (result !== 'sent') await ctx.cooldown.reset();
        if (result === 'notConfigured') return await reply(t.notEnabled.get());
        if (result === 'dmFailed') return await reply(t.dmClosed.get());

        await reply(t.sent.get());
    }
}

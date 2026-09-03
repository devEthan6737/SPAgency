import { createHmac, timingSafeEqual } from 'node:crypto';
import type { GuildMemberStructure, UsingClient } from 'seyfert';
import { GuildConfigCache } from '../protection/index.js';

/** Decoded, verified token payload — only present once {@link VerificationSystem.verifyToken} has confirmed the signature and expiry. */
export interface VerificationTokenPayload {
    /** Guild the join (and the token) belongs to. */
    guildId: string;
    /** Member who joined and was sent the verification link. */
    userId: string;
}

/**
 * Outcome of {@link VerificationSystem.grantRole}.
 * - `granted` — the role was added.
 * - `notConfigured` — verification (or its role) got disabled/unset between the token being issued and this call.
 * - `failed` — the Discord API call itself failed (member left, missing `Manage Roles`, role outranks the bot's own...).
 */
export type GrantRoleResult = 'granted' | 'notConfigured' | 'failed';

/**
 * Web-only verification (OAuth2 + captcha on SPA's own dashboard, outside this repo) — see
 * docs/verification.md for the full design and the API contract the dashboard has to implement
 * against. This class owns everything the bot side needs: issuing/validating the signed token that
 * proves a (guild, user) pair without any database round-trip, and granting the configured role once
 * the dashboard confirms a successful verification via {@link VerificationServer}.
 *
 * The signing secret (`VERIFICATION_SECRET`) never leaves this process — the dashboard doesn't decode
 * the token itself, it asks the bot's HTTP API to do it. That's the whole point: the bot stays the
 * sole authority over what counts as a valid token, instead of two services having to keep a shared
 * secret in sync to both independently trust the same thing.
 */
export class VerificationSystem {
    /** How long a token stays valid after being issued on join. */
    private static readonly TokenTtlMs = 15 * 60 * 1000;

    /**
     * Called from `guildMemberAdd.ts` once every removal-capable system already had its turn (see
     * its doc comment) — DMs `member` a fresh verification link if the guild has verification on.
     * @param client Bot client, used to read the guild's language and send the DM.
     * @param member The member who just joined.
     * @returns Whether a DM with a verification link was sent.
     */
    static async enforce(client: UsingClient, member: GuildMemberStructure): Promise<boolean> {
        if (member.bot) return false;

        const settings = await GuildConfigCache.get(member.guildId);
        if (!settings?.verificationEnable || !settings.verificationRole) return false;

        const webUrl = process.env.VERIFICATION_WEB_URL;
        if (!webUrl) {
            client.logger.error('[verification] VERIFICATION_WEB_URL is not set — cannot send a verification link');
            return false;
        }

        const token = VerificationSystem.issueToken(member.guildId, member.id);
        if (!token) return false;

        const t = client.t(settings.language).systems.verification;
        await member.user.write({ content: t.dm(`${webUrl}/${token}`).get() }).catch(() => {});
        return true;
    }

    /**
     * Signs a fresh token for `(guildId, userId)`, embedding the current time so
     * {@link VerificationSystem.verifyToken} can enforce {@link VerificationSystem.TokenTtlMs} later.
     * @param guildId Guild the member joined.
     * @param userId Member the link is for.
     * @returns The token, or `null` if `VERIFICATION_SECRET` isn't configured — fails closed, never issues an unsigned/unverifiable link.
     */
    static issueToken(guildId: string, userId: string): string | null {
        const secret = process.env.VERIFICATION_SECRET;
        if (!secret) return null;

        const payload = Buffer.from(JSON.stringify({ g: guildId, u: userId, t: Date.now() })).toString('base64url');
        const signature = createHmac('sha256', secret).update(payload).digest('base64url');
        return `${payload}.${signature}`;
    }

    /**
     * Verifies a token's signature and expiry — the sole gate `VerificationServer` relies on for
     * both of its routes, since the bot never persists which tokens it issued.
     * @param token Token as received from the URL (`GET /verify/:token`, `POST /verify/:token/complete`).
     * @returns The decoded `(guildId, userId)` pair if the token is genuine and unexpired, or `null`
     * for anything wrong with it (bad shape, forged signature, expired) — deliberately one
     * undifferentiated failure case for the caller, since `VerificationServer` only needs to know
     * valid-or-not to decide its HTTP response.
     */
    static verifyToken(token: string): VerificationTokenPayload | null {
        const secret = process.env.VERIFICATION_SECRET;
        if (!secret) return null;

        const [payload, signature] = token.split('.');
        if (!payload || !signature) return null;

        const expected = createHmac('sha256', secret).update(payload).digest('base64url');
        const given = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);
        if (given.length !== expectedBuffer.length || !timingSafeEqual(given, expectedBuffer)) return null;

        try {
            const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { g: string; u: string; t: number };
            if (Date.now() - decoded.t > VerificationSystem.TokenTtlMs) return null;

            return { guildId: decoded.g, userId: decoded.u };
        } catch {
            return null;
        }
    }

    /**
     * Grants the guild's currently configured `verificationRole` — read fresh from
     * `GuildConfigCache`, not embedded in the token, so an admin changing the role after the token
     * was issued still gets honored correctly. Called by `VerificationServer` once the dashboard
     * confirms `(guildId, userId)` completed OAuth2 + captcha.
     * @param client Bot client, used to grant the role and log a failure.
     * @param guildId From the verified token payload — never take this from an untrusted source.
     * @param userId From the verified token payload — same caveat.
     * @returns See {@link GrantRoleResult}.
     */
    static async grantRole(client: UsingClient, guildId: string, userId: string): Promise<GrantRoleResult> {
        const settings = await GuildConfigCache.get(guildId);
        if (!settings?.verificationEnable || !settings.verificationRole) return 'notConfigured';

        try {
            await client.members.addRole(guildId, userId, settings.verificationRole);
            return 'granted';
        } catch (error) {
            client.logger.error(`[verification] Failed to grant the verification role in guild ${guildId} to ${userId}`, error);
            return 'failed';
        }
    }
}

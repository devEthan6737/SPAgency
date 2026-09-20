import { timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

/** Bearer-key check shared by every {@link ApiModule} — the web and the bot share one secret, `INTERNAL_API_KEY`, used in both directions. */
export class ApiAuth {
    /**
     * Constant-time comparison of `Authorization: Bearer <key>` against `INTERNAL_API_KEY`.
     * Fails closed: an unset variable never matches, not even an empty header.
     * @param headers Request headers — only `authorization` is read.
     * @returns Whether the header carries a correct, non-empty key.
     */
    static isAuthorized(headers: IncomingHttpHeaders): boolean {
        const apiKey = process.env.INTERNAL_API_KEY;
        if (!apiKey) return false;

        const header = headers.authorization;
        const given = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
        if (!given) return false;

        const givenBuffer = Buffer.from(given);
        const expectedBuffer = Buffer.from(apiKey);
        return givenBuffer.length === expectedBuffer.length && timingSafeEqual(givenBuffer, expectedBuffer);
    }
}

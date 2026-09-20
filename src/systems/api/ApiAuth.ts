import { timingSafeEqual } from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

/** Bearer-key check shared by every {@link ApiModule} — each feature has its own key, so a leak of one doesn't open the others. */
export class ApiAuth {
    /**
     * Constant-time comparison of `Authorization: Bearer <key>` against an environment variable.
     * Fails closed: an unset variable never matches, not even an empty header.
     * @param headers Request headers — only `authorization` is read.
     * @param envName Environment variable holding the expected key, e.g. `VERIFICATION_API_KEY`.
     * @returns Whether the header carries a correct, non-empty key.
     */
    static isAuthorized(headers: IncomingHttpHeaders, envName: string): boolean {
        const apiKey = process.env[envName];
        if (!apiKey) return false;

        const header = headers.authorization;
        const given = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
        if (!given) return false;

        const givenBuffer = Buffer.from(given);
        const expectedBuffer = Buffer.from(apiKey);
        return givenBuffer.length === expectedBuffer.length && timingSafeEqual(givenBuffer, expectedBuffer);
    }
}

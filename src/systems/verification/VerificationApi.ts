import type { UsingClient } from 'seyfert';
import { ApiAuth, reply, type ApiRequest, type ApiResponse } from '../api/index.js';
import { VerificationSystem } from './VerificationSystem.js';

/**
 * The bot's half of the REST contract with SPA's dashboard — see docs/verification.md for the full
 * spec the dashboard has to implement against. Mounted by {@link ApiServer} under `/verify/*`.
 */
export class VerificationApi {
    /** Path prefix {@link ApiServer} mounts this module under. */
    static readonly prefix = 'verify';

    /**
     * Routes a request to one of the two endpoints, or `404` for anything else.
     * @param client Bot client, passed through to {@link VerificationSystem.grantRole}.
     * @param request Request under `/verify`, so `segments` starts at the token.
     * @returns The response to send: `401` on `complete` without the key, `404` for any other route.
     */
    static async handle(client: UsingClient, { method, segments, headers }: ApiRequest): Promise<ApiResponse> {
        // GET /verify/:token
        if (method === 'GET' && segments.length === 1) return VerificationApi.lookup(segments[0]);

        // POST /verify/:token/complete
        if (method === 'POST' && segments.length === 2 && segments[1] === 'complete') {
            // Checked before the token so an unauthenticated caller can't tell valid tokens from invalid ones.
            if (!ApiAuth.isAuthorized(headers)) return reply(401, { error: 'unauthorized' });

            return await VerificationApi.complete(client, segments[0]);
        }

        return reply(404, { error: 'not_found' });
    }

    /**
     * `GET /verify/:token` — tells the dashboard who a token belongs to.
     * @param token The token from the URL.
     * @returns `200` with the token's guild and user, or `400 invalid_token`.
     */
    private static lookup(token: string): ApiResponse {
        const payload = VerificationSystem.verifyToken(token);
        if (!payload) return reply(400, { error: 'invalid_token' });

        return reply(200, payload);
    }

    /**
     * `POST /verify/:token/complete` — grants the verified role, called by the dashboard's backend once OAuth2 and the captcha pass.
     * @param client Bot client, used to grant the role.
     * @param token The token from the URL.
     * @returns `200` once the role is granted, `400 invalid_token`, `409 not_configured` if verification was turned off meanwhile, or `502 grant_failed`.
     */
    private static async complete(client: UsingClient, token: string): Promise<ApiResponse> {
        const payload = VerificationSystem.verifyToken(token);
        if (!payload) return reply(400, { error: 'invalid_token' });

        const result = await VerificationSystem.grantRole(client, payload.guildId, payload.userId);
        if (result === 'notConfigured') return reply(409, { error: 'not_configured' });
        if (result === 'failed') return reply(502, { error: 'grant_failed' });

        return reply(200, { granted: true });
    }
}

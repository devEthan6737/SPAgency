import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { UsingClient } from 'seyfert';
import { VerificationSystem } from './VerificationSystem.js';

/**
 * The bot's half of the REST contract with SPA's dashboard — see docs/verification.md for the full
 * spec the dashboard has to implement against. Just `node:http`, no framework: two routes, no request
 * bodies to parse, no reason to pull in a dependency for this.
 *
 * Binds to `127.0.0.1` only — bot and dashboard run on the same VPS, this was never meant to be
 * reachable from outside it.
 */
export class VerificationServer {
    private static started = false;

    /**
     * Starts the server. Call once, from the ready event.
     * @param client Bot client, captured in the request handler's closure to grant roles.
     */
    static start(client: UsingClient): void {
        if (VerificationServer.started) return;
        VerificationServer.started = true;

        const port = Number(process.env.VERIFICATION_SERVER_PORT ?? 4501);

        createServer((req, res) => {
            void VerificationServer.handle(client, req, res).catch((error) => {
                client.logger.error('[verification] Request handler failed', error);
                VerificationServer.respond(res, 500, { error: 'internal_error' });
            });
        }).listen(port, '127.0.0.1', () => client.logger.info(`[verification] API listening on 127.0.0.1:${port}`));
    }

    /**
     * Routes a request to one of the two endpoints documented in docs/verification.md, or `404` for
     * anything else. No router library — matching on `req.method` plus the split path is all two
     * routes need.
     * @param client Bot client, passed through to {@link VerificationSystem.grantRole}.
     * @param req Incoming request.
     * @param res Response to write to — always ends it, on every branch.
     */
    private static async handle(client: UsingClient, req: IncomingMessage, res: ServerResponse): Promise<void> {
        const segments = (req.url ?? '').split('/').filter(Boolean);

        // GET /verify/:token
        if (req.method === 'GET' && segments.length === 2 && segments[0] === 'verify') {
            const payload = VerificationSystem.verifyToken(segments[1]);
            if (!payload) return VerificationServer.respond(res, 400, { error: 'invalid_token' });

            return VerificationServer.respond(res, 200, payload);
        }

        // POST /verify/:token/complete
        if (req.method === 'POST' && segments.length === 3 && segments[0] === 'verify' && segments[2] === 'complete') {
            if (!VerificationServer.isAuthorized(req)) return VerificationServer.respond(res, 401, { error: 'unauthorized' });

            const payload = VerificationSystem.verifyToken(segments[1]);
            if (!payload) return VerificationServer.respond(res, 400, { error: 'invalid_token' });

            const result = await VerificationSystem.grantRole(client, payload.guildId, payload.userId);
            if (result === 'notConfigured') return VerificationServer.respond(res, 409, { error: 'not_configured' });
            if (result === 'failed') return VerificationServer.respond(res, 502, { error: 'grant_failed' });

            return VerificationServer.respond(res, 200, { granted: true });
        }

        VerificationServer.respond(res, 404, { error: 'not_found' });
    }

    /**
     * Constant-time comparison against `VERIFICATION_API_KEY` — this is what stops anyone but the
     * dashboard's own backend from granting roles. Expects `Authorization: Bearer <key>`.
     * @param req Incoming request — only its `authorization` header is read.
     * @returns Whether the header carries a correct, non-empty key.
     */
    private static isAuthorized(req: IncomingMessage): boolean {
        const apiKey = process.env.VERIFICATION_API_KEY;
        if (!apiKey) return false;

        const header = req.headers.authorization;
        const given = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
        if (!given) return false;

        const givenBuffer = Buffer.from(given);
        const expectedBuffer = Buffer.from(apiKey);
        return givenBuffer.length === expectedBuffer.length && timingSafeEqual(givenBuffer, expectedBuffer);
    }

    /**
     * Writes a JSON response and ends it — every branch in {@link VerificationServer.handle} goes
     * through this, so the response shape (status + JSON body) stays consistent across the API.
     * @param res Response to write to.
     * @param status HTTP status code.
     * @param body Serialized as the JSON response body.
     */
    private static respond(res: ServerResponse, status: number, body: object): void {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
    }
}

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { UsingClient } from 'seyfert';
import { ExpiringMap } from '../shared/ExpiringMap.js';
import { ApiError, reply, type ApiModule, type ApiRequest, type ApiResponse } from './ApiHttp.js';

/**
 * The bot's single HTTP server for the dashboard/web — see docs/api.md. Just `node:http` and a
 * router that picks a module by the first path segment; each feature ({@link ApiModule}) owns its
 * routes. Every request is authenticated with the same `INTERNAL_API_KEY` (see {@link ApiAuth}).
 *
 * Binds to `127.0.0.1` only — bot and web run on the same VPS, this was never meant to be reachable
 * from outside it.
 */
export class ApiServer {
    private static started = false;

    /** Prefixes that already logged a rejected request in the last minute — a probe would otherwise flood the log. */
    private static rejected = new ExpiringMap<string, true>();

    /** Request body cap: the largest legitimate body is a 2000-character message, which is at most 8 KB in UTF-8. */
    private static readonly MaxBodyBytes = 32 * 1024;

    /**
     * Starts the server. Call once, from the ready event.
     * @param client Bot client, handed to every module.
     * @param modules The features to mount, each under `/<prefix>/*`.
     */
    static start(client: UsingClient, modules: readonly ApiModule[]): void {
        if (ApiServer.started) return;
        ApiServer.started = true;

        const port = Number(process.env.BOT_API_PORT ?? 4501);

        createServer((req, res) => {
            void ApiServer.handle(client, modules, req).then(
                (response) => ApiServer.write(res, response),
                (error) => {
                    if (error instanceof ApiError) return ApiServer.write(res, reply(error.status, { error: error.code }));

                    client.logger.error('[api] Request handler failed', error);
                    ApiServer.write(res, reply(500, { error: 'internal_error' }));
                }
            );
        }).listen(port, '127.0.0.1', () => client.logger.info(`[api] Listening on 127.0.0.1:${port}`));
    }

    /**
     * Routes a request to the module whose prefix matches its first path segment, or `404` if none does.
     * @param client Bot client, passed through to the module.
     * @param modules Mounted modules.
     * @param req Incoming request.
     * @returns The module's response.
     */
    private static async handle(client: UsingClient, modules: readonly ApiModule[], req: IncomingMessage): Promise<ApiResponse> {
        const url = new URL(req.url ?? '/', 'http://127.0.0.1');
        const [prefix, ...segments] = url.pathname.split('/').filter(Boolean);

        const module = modules.find((candidate) => candidate.prefix === prefix);
        if (!module) return reply(404, { error: 'not_found' });

        const response = await module.handle(client, {
            method: req.method ?? 'GET',
            segments,
            query: url.searchParams,
            headers: req.headers,
            json: () => ApiServer.readJson(req)
        });

        if (response.status === 401) ApiServer.logRejected(client, module.prefix);
        return response;
    }

    /**
     * Logs that a request was refused for lacking the key, at most once a minute per module. Only the
     * module's prefix is logged, never the path: `/verify/<token>/complete` carries a credential in it.
     * @param client Bot client, for its logger.
     * @param prefix The module that refused the request.
     */
    private static logRejected(client: UsingClient, prefix: string): void {
        if (ApiServer.rejected.has(prefix)) return;

        ApiServer.rejected.set(prefix, true, { ttlMs: 60_000 });
        client.logger.warn(`[api] Refused an unauthenticated request to /${prefix} (more within a minute are not logged)`);
    }

    /**
     * Buffers the request body up to {@link ApiServer.MaxBodyBytes} and parses it as JSON.
     * @param req Request to read.
     * @returns The parsed body.
     * @throws {ApiError} `413` once the cap is exceeded — reading stops there, the rest is never buffered — or `400` for an empty or malformed body.
     */
    private static async readJson(req: IncomingMessage): Promise<unknown> {
        const chunks: Buffer[] = [];
        let size = 0;

        for await (const chunk of req as AsyncIterable<Buffer>) {
            size += chunk.length;
            if (size > ApiServer.MaxBodyBytes) throw new ApiError(413, 'payload_too_large');
            chunks.push(chunk);
        }

        try {
            return JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } catch {
            throw new ApiError(400, 'invalid_body');
        }
    }

    /**
     * Writes a JSON response and ends it — the only place a response is written, so the shape
     * (status + JSON body) stays consistent across every module.
     * @param res Response to write to.
     * @param response Status and body to send.
     */
    private static write(res: ServerResponse, { status, body }: ApiResponse): void {
        // A 413 leaves an unread body on the socket — closing it is what stops the client from sending the rest.
        res.writeHead(status, { 'Content-Type': 'application/json', ...(status === 413 && { Connection: 'close' }) });
        res.end(JSON.stringify(body));
    }
}

import type { UsingClient } from 'seyfert';
import { ApiAuth, ApiError, reply, type ApiRequest, type ApiResponse } from '../api/index.js';
import { SupportConfig, type SupportSettings } from './SupportConfig.js';
import { SupportSystem, type CreateTicketInput } from './SupportSystem.js';
import { SupportTicketChannel, type SupportTicket } from './SupportTicket.js';
import { SupportTicketIndex } from './SupportTicketIndex.js';

/**
 * The bot's half of the REST contract with the web's support pages — see docs/support.md.
 * Mounted by {@link ApiServer} under `/support/*`; every route needs `INTERNAL_API_KEY`.
 */
export class SupportApi {
    static readonly prefix = 'support';

    private static readonly UserIdPattern = /^\d{15,25}$/;

    /**
     * Routes a request to one of the support endpoints, or `404` for anything else.
     * @param client Bot client.
     * @param request Request under `/support`, so `segments` starts at `tickets`.
     */
    static async handle(client: UsingClient, request: ApiRequest): Promise<ApiResponse> {
        // Auth first, so an unauthenticated caller can't tell whether support is configured or up.
        if (!ApiAuth.isAuthorized(request.headers)) return reply(401, { error: 'unauthorized' });

        const settings = SupportConfig.get();
        if (!settings || !SupportTicketIndex.isReady()) return reply(503, { error: 'support_unavailable' });

        const { method, segments } = request;

        if (segments[0] === 'tickets') {
            if (segments.length === 1 && method === 'POST') return await SupportApi.create(client, settings, request);
            if (segments.length === 1 && method === 'GET') return SupportApi.list(request);

            if (segments.length === 3 && segments[2] === 'messages') {
                if (method === 'GET') return await SupportApi.messages(client, settings, request);
                if (method === 'POST') return await SupportApi.send(client, request);
            }
        }

        return reply(404, { error: 'not_found' });
    }

    /** `POST /support/tickets` — opens a ticket for the user the web authenticated. */
    private static async create(client: UsingClient, settings: SupportSettings, request: ApiRequest): Promise<ApiResponse> {
        const input = SupportApi.parseCreateBody(await request.json());
        if (!input) throw new ApiError(400, 'invalid_body');

        const result = await SupportSystem.create(client, settings, input);
        if (result.ok) return reply(201, { ticketId: result.ticket.ticketId, createdAt: SupportTicketChannel.createdAt(result.ticket.channelId).toISOString() });

        if (result.reason === 'tooManyOpen') return reply(429, { error: 'too_many_open_tickets' });
        if (result.reason === 'cooldown') return reply(429, { error: 'cooldown' });
        if (result.reason === 'full') return reply(503, { error: 'support_full' });

        return reply(502, { error: 'ticket_creation_failed' });
    }

    /** `GET /support/tickets?userId=` — the user's open tickets. */
    private static list({ query }: ApiRequest): ApiResponse {
        const userId = query.get('userId');
        if (!userId || !SupportApi.UserIdPattern.test(userId)) throw new ApiError(400, 'invalid_body');

        return reply(200, { tickets: SupportSystem.listOpen(userId).map(SupportApi.serialize) });
    }

    /**
     * `GET /support/tickets/:ticketId/messages?userId=&after=` — the messages newer than the cursor,
     * at most 50 in ascending order; the web calls again with the last `id` if it got a full batch.
     * A ticket that is closing still answers `200`: `404` would send the user to a transcript the web doesn't have yet.
     */
    private static async messages(client: UsingClient, settings: SupportSettings, { segments, query }: ApiRequest): Promise<ApiResponse> {
        const ticket = SupportApi.ownedTicket(segments[1], query.get('userId'));

        const after = query.get('after') ?? undefined;
        if (after !== undefined && !/^\d{1,25}$/.test(after)) throw new ApiError(400, 'invalid_body');

        return reply(200, { messages: await SupportSystem.messages(client, settings, ticket, after, 50) });
    }

    /** `POST /support/tickets/:ticketId/messages` — publishes what the user wrote on the web into the channel. */
    private static async send(client: UsingClient, request: ApiRequest): Promise<ApiResponse> {
        const body = await request.json();
        const { userId, content } = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};

        const ticket = SupportApi.ownedTicket(request.segments[1], userId);
        const text = typeof content === 'string' ? content.trim() : '';
        if (!text || text.length > 2000) throw new ApiError(400, 'invalid_body');

        const result = await SupportSystem.sendUserMessage(client, ticket, text);
        if (result.ok) return reply(200, { id: result.id });

        // The contract has no code for these: a closing ticket is not `404` (the transcript isn't ready), and nothing else fits a Discord failure.
        if (result.reason === 'closing') return reply(409, { error: 'closing' });
        if (result.reason === 'cooldown') return reply(429, { error: 'cooldown' });

        return reply(502, { error: 'send_failed' });
    }

    /**
     * Finds a ticket and checks it belongs to `userId` — the ownership check every ticket route makes.
     * @throws {ApiError} `400` for a malformed `userId`, `404` if the ticket doesn't exist or isn't theirs — deliberately indistinguishable.
     */
    private static ownedTicket(ticketId: string, userId: unknown): SupportTicket {
        if (typeof userId !== 'string' || !SupportApi.UserIdPattern.test(userId)) throw new ApiError(400, 'invalid_body');

        const ticket = SupportTicketIndex.get(ticketId);
        if (!ticket || ticket.userId !== userId) throw new ApiError(404, 'not_found');

        return ticket;
    }

    /** A ticket as the web sees it — no channel id, that's the bot's business. */
    private static serialize({ ticketId, subject, channelId }: SupportTicket) {
        return { ticketId, subject, createdAt: SupportTicketChannel.createdAt(channelId).toISOString() };
    }

    /**
     * Validates the body of `POST /support/tickets` and normalizes it: the subject is collapsed to one
     * line (it goes into the channel topic, whose second line is the subject), an unusable avatar URL
     * is dropped rather than failing the whole request.
     * @returns The input, or `null` if anything required is missing or out of bounds.
     */
    private static parseCreateBody(body: unknown): CreateTicketInput | null {
        if (typeof body !== 'object' || body === null) return null;
        const { userId, username, avatarUrl, subject, message } = body as Record<string, unknown>;

        if (typeof userId !== 'string' || !SupportApi.UserIdPattern.test(userId)) return null;
        if (typeof username !== 'string' || !username.trim()) return null;
        if (typeof subject !== 'string' || typeof message !== 'string') return null;

        const cleanSubject = subject.replace(/\s+/g, ' ').trim();
        const cleanMessage = message.trim();
        // Limits from the contract with the web, which validates the same numbers before calling.
        if (!cleanSubject || cleanSubject.length > 100) return null;
        if (!cleanMessage || cleanMessage.length > 2000) return null;

        return {
            userId,
            username: username.trim().slice(0, 80),
            avatarUrl: SupportApi.isHttpsUrl(avatarUrl) ? avatarUrl : null,
            subject: cleanSubject,
            message: cleanMessage
        };
    }

    /** Whether `value` is an `https:` URL — anything else is dropped, since Discord rejects an embed whose icon isn't one. */
    private static isHttpsUrl(value: unknown): value is string {
        if (typeof value !== 'string') return false;

        try {
            return new URL(value).protocol === 'https:';
        } catch {
            return false;
        }
    }
}

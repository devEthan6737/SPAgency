import type { IncomingHttpHeaders } from 'node:http';
import type { UsingClient } from 'seyfert';

/** What an {@link ApiModule} sees of a request — already routed, so `segments` excludes the module's own prefix. */
export interface ApiRequest {
    method: string;
    /** Path segments after the module's prefix — `/verify/abc/complete` reaches the module as `['abc', 'complete']`. */
    segments: string[];
    query: URLSearchParams;
    headers: IncomingHttpHeaders;
    /**
     * Reads and parses the request body as JSON.
     * @throws {ApiError} `400 invalid_body` if it's empty or not valid JSON, `413 payload_too_large` past {@link ApiServer}'s size cap.
     */
    json(): Promise<unknown>;
}

/** A response to write — modules return one instead of touching the raw `ServerResponse`. */
export interface ApiResponse {
    status: number;
    body: object;
}

/**
 * One feature's slice of the API, mounted under `/<prefix>/*` by {@link ApiServer}. A class with
 * static members satisfies this too, which is how the modules in this repo implement it.
 */
export interface ApiModule {
    prefix: string;
    /**
     * Handles a request routed to this module.
     * @param client Bot client, for the module's Discord calls.
     * @param request The request, with the module's prefix already stripped from `segments`.
     * @returns The response to send. Unknown routes are the module's to answer with a `404`.
     */
    handle(client: UsingClient, request: ApiRequest): Promise<ApiResponse>;
}

/** Thrown anywhere in a request to end it with this exact status and `{ error: code }` body — caught by {@link ApiServer}. */
export class ApiError extends Error {
    /**
     * @param status HTTP status code to respond with.
     * @param code Machine-readable error, sent as `{ error: code }`.
     */
    constructor(
        readonly status: number,
        readonly code: string
    ) {
        super(code);
    }
}

/**
 * Builds an {@link ApiResponse}.
 * @param status HTTP status code.
 * @param body Serialized as the JSON response body.
 */
export function reply(status: number, body: object): ApiResponse {
    return { status, body };
}

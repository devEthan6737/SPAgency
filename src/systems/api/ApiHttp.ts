import type { IncomingHttpHeaders } from 'node:http';
import type { UsingClient } from 'seyfert';

/** What an {@link ApiModule} sees of a request — already routed, so `segments` excludes the module's own prefix. */
export interface ApiRequest {
    /** HTTP method, upper-case. */
    method: string;
    /** Path segments after the module's prefix — `/verify/abc/complete` reaches the module as `['abc', 'complete']`. */
    segments: string[];
    /** The query string. */
    query: URLSearchParams;
    /** The request headers, as Node parsed them. */
    headers: IncomingHttpHeaders;
    /**
     * Reads and parses the request body as JSON.
     * @returns The parsed body, of unknown shape.
     * @throws {ApiError} `400 invalid_body` if it's empty or not valid JSON, `413 payload_too_large` past {@link ApiServer}'s size cap.
     */
    json(): Promise<unknown>;
}

/** A response to write — modules return one instead of touching the raw `ServerResponse`. */
export interface ApiResponse {
    /** HTTP status code. */
    status: number;
    /** Serialized as the JSON response body. */
    body: object;
}

/**
 * One feature's slice of the API, mounted under `/<prefix>/*` by {@link ApiServer}. A class with
 * static members satisfies this too, which is how the modules in this repo implement it.
 */
export interface ApiModule {
    /** First path segment this module answers: `support` mounts it under `/support/*`. */
    prefix: string;
    /**
     * Handles a request routed to this module.
     * @param client Bot client, for the module's Discord calls.
     * @param request The request, with the module's prefix already stripped from `segments`.
     * @returns The response to send. Unknown routes are the module's to answer with a `404`.
     * @throws {ApiError} To end the request with a specific status; anything else becomes a `500`.
     */
    handle(client: UsingClient, request: ApiRequest): Promise<ApiResponse>;
}

/** Thrown anywhere in a request to end it with this exact status and `{ error: code }` body — caught by {@link ApiServer}. */
export class ApiError extends Error {
    /**
     * Creates the error.
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
 * @returns The response for a module's `handle` to return.
 */
export function reply(status: number, body: object): ApiResponse {
    return { status, body };
}

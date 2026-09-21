import type { SupportSettings } from './SupportConfig.js';
import type { TranscriptPayload } from './SupportTranscript.js';

/** `retryable` tells a web that is down (or slow) from a web that refused the transcript — the contract says the latter is the bot's fault and retrying can't fix it. */
export type PushResult = { ok: true } | { ok: false; retryable: boolean; reason: string };

/** The bot's calls to the web — today just the transcript delivery. */
export class SupportWebClient {
    /**
     * Pushes a closed ticket's transcript to the web. The web is idempotent by `ticketId`, so
     * repeating a push never duplicates anything.
     * @param settings Support settings — where the web is and the shared key.
     * @param payload The user's version of the transcript.
     * @returns `ok` only on a `2xx`. A network failure or `5xx` is retryable; any `4xx` (bad key, bad body, over 5 MB) is not.
     */
    static async pushTranscript({ webUrl, webApiKey }: SupportSettings, payload: TranscriptPayload): Promise<PushResult> {
        try {
            const response = await fetch(new URL('/api/support/transcripts', webUrl), {
                method: 'POST',
                headers: { Authorization: `Bearer ${webApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15_000),
                // The request carries the shared key: a redirect must never take it somewhere else.
                redirect: 'error'
            });

            if (response.ok) return { ok: true };
            return { ok: false, retryable: response.status >= 500, reason: `HTTP ${response.status}` };
        } catch (error) {
            return { ok: false, retryable: true, reason: error instanceof Error ? error.message : 'network error' };
        }
    }
}

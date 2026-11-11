import { SeyfertError } from 'seyfert';

/** Reads what a failed Discord REST call says, so callers can tell a gone resource from a passing outage. */
export class DiscordErrors {
    /**
     * @param error Anything caught from a REST call.
     * @returns The HTTP status of a Discord REST failure, or `undefined` for any other kind of error.
     */
    static status(error: unknown): number | undefined {
        if (!(error instanceof SeyfertError)) return undefined;

        return (error.metadata as { status?: number } | undefined)?.status;
    }

    /**
     * @param error Anything caught from a REST call.
     * @returns Whether Discord answered 404: what was asked for no longer exists.
     */
    static isNotFound(error: unknown): boolean {
        return DiscordErrors.status(error) === 404;
    }

    /**
     * @param error Anything caught from a REST call.
     * @returns Whether Discord answered 403 or 404: the resource is gone or the bot lost access to it,
     * as opposed to a transient failure (a 5xx, a rate limit, the network) that says nothing about it.
     */
    static isLostAccess(error: unknown): boolean {
        const status = DiscordErrors.status(error);

        return status === 403 || status === 404;
    }
}

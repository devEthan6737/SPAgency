import { UBFB } from 'ubfb';

/**
 * Shared UBFB client — REST + presence WebSocket + local cache, all in one.
 * `isBlacklisted()`/`getCachedEntry()` work off the cache without a network
 * call once `sync` has fired (or any REST call ran).
 *
 * `name`/`avatarUrl` are only known once the bot's own user is available, so
 * this isn't constructed at import time — call {@link initUbfb} once from
 * the `ready` event, then read it with {@link getUbfb} anywhere else.
 */
let instance: UBFB | undefined;

/**
 * Creates and connects the shared UBFB client. Call once, from the `ready` event, once the bot's own
 * user (and so its `name`/`avatarUrl`) is available.
 * @param name Bot name reported to UBFB.
 * @param avatarUrl Bot avatar reported to UBFB, if any.
 * @returns The connected client — also stored for later retrieval via {@link getUbfb}.
 */
export function initUbfb(name: string, avatarUrl?: string): UBFB {
    instance = new UBFB({ name, avatarUrl });

    instance.on('error', (error) => {
        console.error('[UBFB]', error);
    });

    instance.connect();
    return instance;
}

/**
 * The shared UBFB client created by {@link initUbfb}.
 * @throws If called before {@link initUbfb} has run.
 */
export function getUbfb(): UBFB {
    if (!instance) throw new Error('UBFB client not initialized yet — initUbfb() must run first, from the ready event.');
    return instance;
}

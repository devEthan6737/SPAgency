import { createEvent } from 'seyfert';
import { ApiServer } from '../systems/api/index.js';
import { AntiraidSystem } from '../systems/antiraid/index.js';
import { GuildConfigCache } from '../systems/protection/index.js';
import { RaidmodeExpiry } from '../systems/raidmode/index.js';
import { startTempbanPoller } from '../systems/tempban/poller.js';
import { initUbfb } from '../systems/ubfb/client.js';
import { SupportApi, SupportSystem } from '../systems/support/index.js';
import { VerificationApi } from '../systems/verification/index.js';

/**
 * `true` once one-time process setup below has run. `ready` fires again on every fresh gateway
 * session (not on a resume — Discord replays whatever a resume missed on its own), so this flag is
 * used instead of `{ once: true }`: the antiraid recheck needs to run on every fresh session, but the
 * rest of this is real one-time setup that must not repeat.
 */
let initialized = false;

/**
 * Fires on every fresh gateway session (see `initialized` above for why not just once). First-time
 * setup (logger, UBFB client, tempban poller, `GuildConfigCache`, `ApiServer`) runs once.
 * Every time, it also rechecks antiraid prerequisites for every guild — the only case none of
 * `guildRoleUpdate`/`guildRoleDelete`/`guildMemberUpdate` can cover is a change that happened while
 * the bot was disconnected (see docs/antiraid.md section 6) — and (re)starts `RaidmodeExpiry`'s
 * per-guild timers, which don't survive a restart.
 */
export default createEvent({
    data: { name: 'ready', once: false },
    async run(user, client) {
        if (!initialized) {
            initialized = true;
            client.logger.info(`${user.username} encendido.`);
            initUbfb(user.username, user.avatarURL());
            startTempbanPoller(client);
            GuildConfigCache.start(client);
            ApiServer.start(client, [VerificationApi, SupportApi]);
        }

        // Covers drift from while offline — everything else reacts to role/member events, not a timer.
        void AntiraidSystem.recheckAllPrerequisites(client).catch((error) =>
            client.logger.error('[antiraid] Startup prerequisites check failed', error)
        );

        // The index is rebuilt on every fresh session, not just the first: a ticket channel deleted while the gateway was down never fires `channelDelete`.
        void SupportSystem.start(client);

        RaidmodeExpiry.start(client);
    }
});

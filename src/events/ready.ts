import { createEvent } from 'seyfert';
import { AntiraidSystem } from '../systems/antiraid/index.js';
import { GuildConfigCache } from '../systems/protection/index.js';
import { RaidmodeExpiry } from '../systems/raidmode/index.js';
import { startTempbanPoller } from '../systems/tempban/poller.js';
import { initUbfb } from '../systems/ubfb/client.js';

// `ready` fires again on every fresh gateway session (not on a resume — Discord replays whatever a
// resume missed on its own), which is exactly when a role/permission change could have happened
// without any of us seeing the event for it. The antiraid recheck below needs that every time; the
// rest of this is real one-time process setup, so it's gated by this flag instead of `once: true`.
let initialized = false;

export default createEvent({
    data: { name: 'ready', once: false },
    async run(user, client) {
        if (!initialized) {
            initialized = true;
            client.logger.info(`${user.username} encendido.`);
            initUbfb(user.username, user.avatarURL());
            startTempbanPoller(client);
            GuildConfigCache.start(client);
        }

        // Catches drift from while the bot was offline/disconnected — everything else runs
        // reactively off guildRoleUpdate/guildRoleDelete/guildMemberUpdate, not on a timer.
        void AntiraidSystem.recheckAllPrerequisites(client).catch((error) =>
            client.logger.error('[antiraid] Startup prerequisites check failed', error)
        );

        RaidmodeExpiry.start(client);
    }
});

import { createEvent } from 'seyfert';
import { startTempbanPoller } from '../systems/tempban/poller.js';
import { initUbfb } from '../systems/ubfb/client.js';

export default createEvent({
    data: { name: 'ready', once: true },
    async run(user, client) {
        client.logger.info(`${user.username} encendido.`);
        initUbfb(user.username, user.avatarURL());
        startTempbanPoller(client);
    }
});

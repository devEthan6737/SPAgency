import type { Client } from 'seyfert';
import type es from './locales/es.js';
import type { commandMiddlewares } from './middlewares/isOwner.middleware.js';

declare module 'seyfert' {
    interface SeyfertRegistry {
        langs: typeof es;
        client: Client;
        middlewares: typeof commandMiddlewares;
    }

    interface ExtraProps {
        /** Folder this command lives in under src/commands, used to group it in /commands. */
        category?: string;
    }
}

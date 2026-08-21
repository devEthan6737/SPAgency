import type { Client } from 'seyfert';
import type es from './locales/es.js';

declare module 'seyfert' {
    interface SeyfertRegistry {
        langs: typeof es;
        client: Client;
    }

    interface ExtraProps {
        /** Folder this command lives in under src/commands, used to group it in /commands. */
        category?: string;
    }
}

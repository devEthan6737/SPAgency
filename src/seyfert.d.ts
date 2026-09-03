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
        /**
         * Excludes this command from Discord registration entirely in production — see
         * `src/systems/shared/Environment.ts`. Filtered out of `client.commands.values` before
         * `uploadCommands()` reads it, so a production process neither registers nor can execute it.
         * For internal/debug tooling only (see `/cache`), never for anything a guild admin should use.
         */
        devOnly?: boolean;
    }
}

import type { Client } from 'seyfert';
import type es from './locales/es.js';

declare module 'seyfert' {
    interface SeyfertRegistry {
        langs: typeof es;
        client: Client;
    }
}

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

export function connectDatabase(url: string) {
    const client = postgres(url);
    return drizzle(client, { schema });
}

export type Database = ReturnType<typeof connectDatabase>;

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client, { schema });
/** Raw postgres.js client — for LISTEN/NOTIFY and anything else outside drizzle's query builder. */
export const sql = client;

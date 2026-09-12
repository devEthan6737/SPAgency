import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

/**
 * Opens a new postgres.js connection and wraps it in a drizzle instance bound to the project's schema.
 * @param url Postgres connection string.
 * @returns A drizzle client typed against every table in `schema`.
 */
export function connectDatabase(url: string) {
    const client = postgres(url);
    return drizzle(client, { schema });
}

/** Type of the drizzle client returned by {@link connectDatabase}. */
export type Database = ReturnType<typeof connectDatabase>;

const client = postgres(process.env.DATABASE_URL!);

/** Shared drizzle client the whole bot queries through — built from `DATABASE_URL`. */
export const db = drizzle(client, { schema });
/** Raw postgres.js client — for LISTEN/NOTIFY and anything else outside drizzle's query builder. */
export const sql = client;

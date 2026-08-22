// ==============================================================================
// DELT — Neon PostgreSQL Client & Drizzle ORM Instance
// Server-only connection with connection pooling & serverless resilience
// ==============================================================================
import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';
// Enable WebSocket connection pooling for serverless transactions
neonConfig.fetchConnectionCache = true;
/**
 * Creates a serverless Drizzle ORM instance connected to Neon PostgreSQL.
 * Safe for Next.js API Routes and Server Components.
 */
export function getDb() {
    var connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('[Neon Database Error] DATABASE_URL is not set in environment variables.');
    }
    var pool = new Pool({ connectionString: connectionString });
    return drizzle(pool, { schema: schema });
}
export var db = process.env.DATABASE_URL
    ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema: schema })
    : null;
export * from './schema';

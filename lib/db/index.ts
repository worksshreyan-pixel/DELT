// ==============================================================================
// DELT — Neon PostgreSQL Client & Drizzle ORM Instance
// Server-only connection with connection pooling & serverless resilience
// ==============================================================================

import { neon, neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './schema';

// Enable WebSocket connection pooling for serverless transactions
neonConfig.fetchConnectionCache = true;

/**
 * Creates a serverless Drizzle ORM instance connected to Neon PostgreSQL.
 * Safe for Next.js API Routes and Server Components.
 */
export function getDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      '[Neon Database Error] DATABASE_URL is not set in environment variables.'
    );
  }

  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}

export const db = process.env.DATABASE_URL
  ? drizzle(new Pool({ connectionString: process.env.DATABASE_URL }), { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from './schema';

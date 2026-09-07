import { Pool, PoolConfig } from 'pg';
import { getDatabaseUrl } from './env';

// Ensure environment variables from .env are available in all Node/Next runtimes
if (!process.env.DATABASE_URL && typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv').config();
  } catch {
    // Environment variables managed by hosting environment
  }
}

function buildPoolConfig(connStr: string): PoolConfig {
  const isNeonOrRemote =
    connStr.includes('neon.tech') ||
    connStr.includes('aws') ||
    connStr.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production';

  return {
    connectionString: connStr,
    ssl: isNeonOrRemote ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const globalWithPg = global as typeof globalThis & {
  _pgPool?: Pool;
  _pgPoolConnectionString?: string;
};

export function getPool(): Pool {
  const currentUrl = getDatabaseUrl();

  if (!currentUrl) {
    throw new Error(
      '[Database Configuration Error] DATABASE_URL is not set. Please ensure DATABASE_URL is configured in your .env file or hosting environment variables.'
    );
  }

  // If pool already exists and connection string hasn't changed, reuse it
  if (
    globalWithPg._pgPool &&
    globalWithPg._pgPoolConnectionString === currentUrl
  ) {
    return globalWithPg._pgPool;
  }

  // If previous pool exists with a different or empty URL, cleanly close it
  if (globalWithPg._pgPool) {
    try {
      globalWithPg._pgPool.end().catch(() => {});
    } catch {
      // Ignore cleanup error
    }
  }

  const config = buildPoolConfig(currentUrl);
  const newPool = new Pool(config);

  globalWithPg._pgPool = newPool;
  globalWithPg._pgPoolConnectionString = currentUrl;

  return newPool;
}

// Proxy export so existing `pool.query(...)` imports work seamlessly
const pool = new Proxy({} as Pool, {
  get(_target, prop: string | symbol) {
    const activePool = getPool() as unknown as Record<string | symbol, unknown>;
    const value = activePool[prop];
    if (typeof value === 'function') {
      return value.bind(activePool);
    }
    return value;
  },
});

export default pool;
export { pool };

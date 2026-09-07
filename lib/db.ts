import { Pool } from 'pg';
import { getDatabaseUrl } from './env';

const connectionString = getDatabaseUrl();

let pool: Pool;

const poolConfig = {
  connectionString: connectionString || undefined,
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
} else {
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool(poolConfig);
  }
  pool = globalWithPg._pgPool;
}

export default pool;
export { pool };

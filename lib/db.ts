import { Pool } from 'pg';
import { getDatabaseUrl } from './env';

const connectionString = getDatabaseUrl();

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
} else {
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  pool = globalWithPg._pgPool;
}

export default pool;
export { pool };

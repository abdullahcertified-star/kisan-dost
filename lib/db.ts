import { Pool } from 'pg';

let pool: Pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: true,
    },
  });
} else {
  const globalWithPg = global as typeof globalThis & { _pgPool?: Pool };
  if (!globalWithPg._pgPool) {
    globalWithPg._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: true,
      },
    });
  }
  pool = globalWithPg._pgPool;
}

export default pool;
export { pool };

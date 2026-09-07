// db.js
const { Pool } = require('pg');
require('dotenv').config();

const { getDatabaseUrl } = require('./lib/env');

function createPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      '[Database Configuration Error] DATABASE_URL is not set. Please configure DATABASE_URL in your .env file.'
    );
  }

  const isNeonOrRemote =
    connectionString.includes('neon.tech') ||
    connectionString.includes('aws') ||
    connectionString.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production';

  return new Pool({
    connectionString,
    ssl: isNeonOrRemote ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

let activePool = null;

const poolProxy = new Proxy({}, {
  get(_target, prop) {
    if (!activePool) {
      activePool = createPool();
    }
    const value = activePool[prop];
    if (typeof value === 'function') {
      return value.bind(activePool);
    }
    return value;
  }
});

module.exports = poolProxy;

// db.js
const { Pool } = require('pg');
require('dotenv').config();

const { getDatabaseUrl } = require('./lib/env');

const connectionString = getDatabaseUrl();

// Initialize the database connection pool using Neon configurations
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

module.exports = pool;

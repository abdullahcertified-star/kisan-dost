// db.js
const { Pool } = require('pg');
require('dotenv').config();

const NEON_FALLBACK_URL =
  'postgresql://neondb_owner:npg_wVMOjs1XRS7c@ep-solitary-forest-aewbhig2-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  NEON_FALLBACK_URL;

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

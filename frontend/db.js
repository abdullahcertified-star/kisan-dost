// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the database connection pool using Neon configurations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true, // Neon requires encrypted SSL connections
  },
});

module.exports = pool;

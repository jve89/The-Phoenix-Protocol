const { Pool } = require('pg');
const { logEvent } = require('../utils/db_logger');

// Validate critical ENV var
if (!process.env.DATABASE_URL) {
  logEvent('db', 'error', 'Missing DATABASE_URL');
  throw new Error('Missing DATABASE_URL');
}

// Initialize Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL in production if required by host
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Handle unexpected errors on idle clients
pool.on('error', (err) => {
  logEvent('db', 'error', `Unexpected idle client error: ${err.message}`);
  // Depending on your strategy, you might exit process here
});

// DDL for initial schema (idempotent)
const initSQL = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    gender TEXT NOT NULL,
    goal_stage TEXT NOT NULL,
    plan TEXT,
    plan_limit INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    session_id TEXT,
    first_guide_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );`,
  `CREATE TABLE IF NOT EXISTS daily_guides (
    date TEXT PRIMARY KEY,
    guide JSONB NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS guide_generation_logs (
    id SERIAL PRIMARY KEY,
    source TEXT,
    level TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );`
];

/**
 * Connect and initialize database schema
 */
async function connectAndInit() {
  try {
    for (const sql of initSQL) {
      await pool.query(sql);
      logEvent('db', 'info', 'Executed init SQL');
    }
    logEvent('db', 'info', 'Database schema is ready');
  } catch (err) {
    logEvent('db', 'error', `Schema initialization failed: ${err.message}`);
    throw err;
  }
}

/**
 * Execute a query with automatic retry on transient errors
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 */
async function query(text, params) {
  const MAX_RETRIES = 2;
  let attempt = 0;
  while (true) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      const transientCodes = ['57P01', 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT'];
      if (attempt < MAX_RETRIES && transientCodes.includes(err.code)) {
        attempt++;
        const delayMs = 100 * Math.pow(2, attempt);
        logEvent('db', 'warn', `Query transient error (${err.code}), retry ${attempt} in ${delayMs}ms`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      logEvent('db', 'error', `Query failed: ${err.message} | SQL: ${text}`);
      throw err;
    }
  }
}

/**
 * Gracefully shutdown the pool
 */
async function closePool() {
  try {
    await pool.end();
    logEvent('db', 'info', 'DB pool closed');
  } catch (err) {
    logEvent('db', 'warn', `Error closing DB pool: ${err.message}`);
  }
}

module.exports = {
  connectAndInit,
  query,
  closePool
};

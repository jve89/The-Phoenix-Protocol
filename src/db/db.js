const { Pool } = require('pg');

// Validate critical ENV var
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  throw new Error('Missing DATABASE_URL');
}

// Initialize Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // 🔒 Force SSL for all environments
});

// Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error(`Unexpected idle client error: ${err.message}`);
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
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trial_user BOOLEAN DEFAULT FALSE;`,
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
      console.log('✅ Executed init SQL');
    }
    console.log('✅ Database schema is ready');
  } catch (err) {
    console.error(`Schema initialization failed: ${err.message}`);
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
        console.warn(`Query transient error (${err.code}), retry ${attempt} in ${delayMs}ms`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }
      console.error(`Query failed: ${err.message} | SQL: ${text}`);
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
    console.log('✅ DB pool closed');
  } catch (err) {
    console.warn(`Error closing DB pool: ${err.message}`);
  }
}

// Expose a raw connection for transactions
function connect() {
  return pool.connect();
}

module.exports = {
  connectAndInit,
  query,
  closePool,
  connect
};

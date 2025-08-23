const { Pool } = require('pg');

// Validate critical ENV var
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  throw new Error('Missing DATABASE_URL');
}

// Initialize Postgres pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep existing SSL behavior unchanged to avoid surprises
  ssl: { rejectUnauthorized: false }
});

// Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error(`Unexpected idle client error: ${err.message}`);
});

// DDL for initial schema (idempotent)
const initSQL = [
  // Users table (mirrors prod schema; split counters + safe defaults)
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    gender TEXT NOT NULL,
    goal_stage TEXT NOT NULL,
    plan INTEGER NOT NULL,
    plan_limit INTEGER NOT NULL,
    is_trial_user BOOLEAN NOT NULL DEFAULT FALSE,
    trial_usage_count INTEGER NOT NULL DEFAULT 0,
    paid_usage_count  INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_trial_sent_at TIMESTAMP,
    last_paid_sent_at TIMESTAMP,
    trial_started_at TIMESTAMP,
    paid_started_at TIMESTAMP,
    trial_farewell_sent_at TIMESTAMP,
    paid_farewell_sent_at TIMESTAMP,
    unsubscribed BOOLEAN DEFAULT FALSE,
    session_id TEXT,
    bounces INTEGER NOT NULL DEFAULT 0
  );`,

  // daily_guides table with date PK and created_at timestamp
  `CREATE TABLE IF NOT EXISTS daily_guides (
    date DATE PRIMARY KEY,
    guide JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // delivery_log with safe defaults + FK to users (matches prod)
  `CREATE TABLE IF NOT EXISTS delivery_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    email TEXT,
    variant TEXT,
    status TEXT,
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivery_type TEXT
  );`,

  // Ensure FK exists (idempotent: add if missing)
  `DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'delivery_log_user_id_fkey'
     ) THEN
       ALTER TABLE delivery_log
         ADD CONSTRAINT delivery_log_user_id_fkey
         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
     END IF;
   END$$;`,

  // guide_generation_logs table, created_at default
  `CREATE TABLE IF NOT EXISTS guide_generation_logs (
    id SERIAL PRIMARY KEY,
    source TEXT,
    level TEXT,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );`
];

/**
 * Connect and initialize database schema.
 * In production, this is a NO-OP to avoid schema drift; use migrations instead.
 */
async function connectAndInit() {
  if (process.env.NODE_ENV === 'production') {
    console.log('ℹ️ Skipping schema init in production (use migrations).');
    return;
  }
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
      const code = err && err.code ? String(err.code) : '';
      const msg = err && err.message ? String(err.message) : '';

      // Known transient indicators across drivers/platforms
      const transientCodes = new Set([
        '57P01',        // admin_shutdown / connection terminated
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'EPIPE'
      ]);
      const transientRegex = /(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EPIPE|socket hang up|Connection terminated|read ECONNRESET)/i;

      const isTransient =
        transientCodes.has(code) ||
        transientRegex.test(msg);

      if (attempt < MAX_RETRIES && isTransient) {
        attempt++;
        const delayMs = 100 * Math.pow(2, attempt) + Math.floor(Math.random() * 50);
        console.warn(`Query transient error (${code || 'no-code'}): ${msg}. Retry ${attempt}/${MAX_RETRIES} in ${delayMs}ms`);
        await new Promise(res => setTimeout(res, delayMs));
        continue;
      }

      console.error(`Query failed: ${msg} | SQL: ${text}`);
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

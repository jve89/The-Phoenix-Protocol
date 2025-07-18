// src/db/db.js

require('dotenv').config();
const { Pool } = require('pg');

// Initialize Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Create required tables if they don't exist
const initSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT NOT NULL,
  goal_stage TEXT NOT NULL,
  plan TEXT,
  plan_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  session_id TEXT,
  first_guide_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_guides (
  date TEXT PRIMARY KEY,
  guide JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS guide_generation_logs (
  id SERIAL PRIMARY KEY,
  source TEXT,
  level TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

/**
 * Connect to the database and initialize tables + columns
 */
async function connectAndInit() {
  try {
    // 1️⃣ Ensure base tables exist
    await pool.query(initSQL);
    console.log('✅ Database schema is ready');

    // 2️⃣ Add any missing user‑columns (safe even if already present)
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS plan_limit INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS bounces INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS session_id TEXT;
    `);
    console.log('✅ Users table columns updated (plan_limit, usage_count, bounces, session_id)');

    // 3️⃣ Verify connection
    const result = await pool.query(
      'SELECT inet_server_addr() AS host, current_database() AS db'
    );
    console.log('✅ Connected to DB:', result.rows[0]);
  } catch (error) {
    console.error('❌ Failed to initialize Postgres:', error);
    throw error;
  }
}

/**
 * Execute a parameterized SQL query
 */
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ DB query error:', err.message, { text, params });
    throw err;
  }
}

module.exports = {
  connectAndInit,
  query
};

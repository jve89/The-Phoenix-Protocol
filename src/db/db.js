require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// SQL for users table with all expected columns & proper types
const usersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT,
  plan TEXT,
  end_date TIMESTAMP, -- proper date type
  session_id TEXT,
  goal_stage TEXT,
  first_guide_sent_at TIMESTAMP,
  bounces INTEGER DEFAULT 0,
  payment_status TEXT,
  stripe_customer_id TEXT,
  stripe_payment_intent TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Initialize DB (call on app startup)
async function connectAndInit() {
  try {
    await pool.query(usersTableSQL);
    console.log('✅ Users table ready in Postgres');

    const result = await pool.query('SELECT inet_server_addr() AS host, current_database() AS db');
    console.log('✅ Connected to DB:', result.rows[0]);
  } catch (error) {
    console.error('❌ Failed to initialize Postgres:', error);
    throw error;
  }
}

// Wrapper to execute queries with error handling
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ DB query error:', err.message, { text, params });
    throw err;
  }
}

// Fetch user by session_id
async function getUserBySessionId(sessionId) {
  const result = await query('SELECT * FROM users WHERE session_id = $1', [sessionId]);
  return result.rows[0];
}

module.exports = {
  connectAndInit,
  query,
  getUserBySessionId,
};

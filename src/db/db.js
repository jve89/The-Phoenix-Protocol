require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// SQL table schema for users
const usersTableSQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  gender TEXT,
  goal_stage TEXT,
  plan TEXT,
  end_date TIMESTAMP,
  first_guide_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

// Init DB and table
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

// Safe query wrapper
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('❌ DB query error:', err.message, { text, params });
    throw err;
  }
}

// Utility: fetch user by session ID
async function getUserBySessionId(sessionId) {
  const result = await query('SELECT * FROM users WHERE session_id = $1', [sessionId]);
  return result.rows[0];
}

module.exports = {
  connectAndInit,
  query,
  getUserBySessionId,
};

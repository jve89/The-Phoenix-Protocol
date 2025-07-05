require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Ensure the users table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        name TEXT,
        gender TEXT,
        plan TEXT,
        end_date TEXT
      )
    `);
    console.log('✅ Users table ready in Postgres');
  } catch (error) {
    console.error('❌ Failed to initialize Postgres table:', error);
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
};

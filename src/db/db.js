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
    
    // Diagnostic DB host + name check
    try {
      const result = await pool.query('SELECT inet_server_addr() AS host, current_database() AS db');
      console.log('✅ Connected to DB:', result.rows[0]);
    } catch (err) {
      console.error('❌ Failed to check DB connection details:', err);
    }

  } catch (error) {
    console.error('❌ Failed to initialize Postgres table:', error);
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
};

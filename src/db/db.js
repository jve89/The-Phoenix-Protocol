require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Heroku requires SSL with self-signed certs
  },
});

// Create table if it doesn't exist
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

// Provide a lightweight compatibility API similar to sqlite3
module.exports = {
  run: async (query, params, callback) => {
    try {
      await pool.query(query, params);
      if (callback) callback(null);
    } catch (err) {
      console.error('❌ DB run error:', err);
      if (callback) callback(err);
    }
  },

  get: async (query, params, callback) => {
    try {
      const result = await pool.query(query, params);
      if (callback) callback(null, result.rows[0]);
    } catch (err) {
      console.error('❌ DB get error:', err);
      if (callback) callback(err);
    }
  },

  all: async (query, params, callback) => {
    try {
      const result = await pool.query(query, params);
      if (callback) callback(null, result.rows);
    } catch (err) {
      console.error('❌ DB all error:', err);
      if (callback) callback(err);
    }
  },
};

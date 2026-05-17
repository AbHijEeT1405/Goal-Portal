const { Pool } = require('pg');
const { DATABASE_URL } = require('../config/env');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ Connected to Neon PostgreSQL'))
  .catch((err) => console.error('❌ DB connection failed:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
};
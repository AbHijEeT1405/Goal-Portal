const { Pool } = require('pg');
const { DATABASE_URL } = require('../config/env');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected idle client error:', err.message);
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to Neon PostgreSQL');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
})();

setInterval(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('Keep-alive failed:', err.message);
  }
}, 4 * 60 * 1000);

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
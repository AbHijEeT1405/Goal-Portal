const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

async function login(email, password) {
  const { rows } = await db.query(
    `SELECT u.*, m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.email = $1`, [email]
  );
  const user = rows[0];
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: payload };
}

module.exports = { login };
const db = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');

function buildAuthResponse(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, user: payload };
}

async function getUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT u.*, m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.email = $1`,
    [email]
  );

  return rows[0];
}

async function login(email, password) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  return buildAuthResponse(user);
}

async function microsoftLogin(email) {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('No local account mapped for this Microsoft user');
  }

  return buildAuthResponse(user);
}

module.exports = { login, microsoftLogin };
const db = require('../../db');

async function getActiveCycle() {
  const { rows } = await db.query(
    `SELECT * FROM cycles WHERE is_active = true LIMIT 1`
  );
  return rows[0] || null;
}

async function getAllCycles() {
  const { rows } = await db.query(
    `SELECT * FROM cycles ORDER BY created_at DESC`
  );
  return rows;
}

async function createCycle(data) {
  const {
    name,
    goal_setting_opens,
    q1_opens,
    q2_opens,
    q3_opens,
    q4_opens,
  } = data;

  await db.query(`UPDATE cycles SET is_active = false`);

  const { rows: [cycle] } = await db.query(
    `INSERT INTO cycles (
      name,
      goal_setting_opens,
      q1_opens,
      q2_opens,
      q3_opens,
      q4_opens,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, true)
    RETURNING *`,
    [name, goal_setting_opens, q1_opens, q2_opens, q3_opens, q4_opens]
  );

  return cycle;
}

async function updateCycle(id, data) {
  const {
    name,
    goal_setting_opens,
    q1_opens,
    q2_opens,
    q3_opens,
    q4_opens,
    is_active,
  } = data;

  if (is_active === true) {
    await db.query(`UPDATE cycles SET is_active = false WHERE id <> $1`, [id]);
  }

  const { rows: [cycle] } = await db.query(
    `UPDATE cycles
     SET name = $1,
         goal_setting_opens = $2,
         q1_opens = $3,
         q2_opens = $4,
         q3_opens = $5,
         q4_opens = $6,
         is_active = $7
     WHERE id = $8
     RETURNING *`,
    [
      name,
      goal_setting_opens,
      q1_opens,
      q2_opens,
      q3_opens,
      q4_opens,
      is_active,
      id,
    ]
  );

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  return cycle;
}

async function activateCycle(id) {
  await db.query(`UPDATE cycles SET is_active = false`);

  const { rows: [cycle] } = await db.query(
    `UPDATE cycles
     SET is_active = true
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  if (!cycle) {
    throw new Error('Cycle not found');
  }

  return cycle;
}

module.exports = {
  getActiveCycle,
  getAllCycles,
  createCycle,
  updateCycle,
  activateCycle,
};
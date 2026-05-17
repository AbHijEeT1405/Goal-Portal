const db = require('../db');

async function log({ goalId, changedBy, action, field, oldVal, newVal }) {
  await db.query(
    `INSERT INTO audit_logs (goal_id, changed_by, action, field_changed, old_value, new_value)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [goalId, changedBy, action, field || null, oldVal?.toString() || null, newVal?.toString() || null]
  );
}

module.exports = { log };
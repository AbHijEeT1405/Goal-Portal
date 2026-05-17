const db = require('../../db');

async function achievementReport(quarter) {
  const { rows } = await db.query(
    `SELECT u.name as employee, u.department, g.thrust_area, g.title,
            g.uom_type, g.target, g.weightage,
            c.actual_achievement, c.progress_status, c.progress_score, c.quarter
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     LEFT JOIN checkins c ON c.goal_id = g.id AND ($1::text IS NULL OR c.quarter = $1)
     WHERE g.status = 'locked'
     ORDER BY u.name, g.title`,
    [quarter || null]
  );
  return rows;
}

async function completionDashboard() {
  const { rows } = await db.query(
    `SELECT u.name, u.email, u.department,
       COUNT(g.id) FILTER (WHERE g.status='locked') as locked_goals,
       COUNT(g.id) FILTER (WHERE g.status='submitted') as submitted_goals,
       COUNT(g.id) FILTER (WHERE g.status='draft') as draft_goals,
       COUNT(c.id) as total_checkins
     FROM users u
     LEFT JOIN goals g ON g.employee_id = u.id
     LEFT JOIN checkins c ON c.goal_id = g.id
     WHERE u.role = 'employee'
     GROUP BY u.id, u.name, u.email, u.department
     ORDER BY u.name`
  );
  return rows;
}

async function auditLogs(limit = 100) {
  const { rows } = await db.query(
    `SELECT a.*, g.title as goal_title, u.name as changed_by_name
     FROM audit_logs a
     LEFT JOIN goals g ON a.goal_id = g.id
     JOIN users u ON a.changed_by = u.id
     ORDER BY a.changed_at DESC
     LIMIT $1`, [limit]
  );
  return rows;
}

module.exports = { achievementReport, completionDashboard, auditLogs };
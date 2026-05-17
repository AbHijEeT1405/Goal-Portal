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

async function completionDashboard(quarter = 'Q1') {
  const { rows } = await db.query(
    `SELECT
       u.name,
       u.email,
       u.department,
       m.name AS manager_name,
       COUNT(g.id) FILTER (WHERE g.status = 'locked')::int AS locked_goals,
       COUNT(c.id) FILTER (WHERE c.quarter = $1)::int AS completed_checkins,
       (COUNT(g.id) FILTER (WHERE g.status = 'locked')
         - COUNT(c.id) FILTER (WHERE c.quarter = $1))::int AS pending_checkins
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     LEFT JOIN goals g ON g.employee_id = u.id
     LEFT JOIN checkins c ON c.goal_id = g.id
     WHERE u.role = 'employee'
     GROUP BY u.id, u.name, u.email, u.department, m.name
     ORDER BY u.name`,
    [quarter]
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
     LIMIT $1`,
    [limit]
  );
  return rows;
}

async function getAnalytics() {
  const { rows: kpiRows } = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'employee') AS total_employees,
      (SELECT COUNT(*)::int FROM goals WHERE status = 'locked') AS locked_goals,
      (SELECT COUNT(*)::int FROM checkins) AS total_checkins,
      (
        SELECT COALESCE(ROUND(AVG(progress_score)::numeric, 2), 0)
        FROM checkins
      ) AS avg_score
  `);

  const { rows: byQuarter } = await db.query(`
    SELECT
      quarter,
      COUNT(*)::int AS count,
      COALESCE(ROUND(AVG(progress_score)::numeric, 2), 0) AS avg_score
    FROM checkins
    GROUP BY quarter
    ORDER BY quarter
  `);

  const { rows: byStatus } = await db.query(`
    SELECT
      progress_status AS status,
      COUNT(*)::int AS count
    FROM checkins
    GROUP BY progress_status
    ORDER BY progress_status
  `);

  const { rows: managerEffectiveness } = await db.query(`
    SELECT
      m.id AS manager_id,
      m.name AS manager_name,
      COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'locked')::int AS total_locked_goals,
      COUNT(DISTINCT c.id)::int AS total_checkins_submitted,
      CASE
        WHEN COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'locked') = 0 THEN 0
        ELSE ROUND(
          (COUNT(DISTINCT c.id)::numeric /
           NULLIF(COUNT(DISTINCT g.id) FILTER (WHERE g.status = 'locked'), 0)) * 100,
          1
        )
      END AS checkin_completion_rate
    FROM users e
    JOIN users m ON e.manager_id = m.id
    LEFT JOIN goals g ON g.employee_id = e.id
    LEFT JOIN checkins c ON c.goal_id = g.id
    WHERE e.role = 'employee'
      AND m.role = 'manager'
    GROUP BY m.id, m.name
    ORDER BY checkin_completion_rate DESC
  `);

  return {
    kpis: kpiRows[0],
    byQuarter,
    byStatus,
    managerEffectiveness,
  };
}

module.exports = {
  achievementReport,
  completionDashboard,
  auditLogs,
  getAnalytics,
};
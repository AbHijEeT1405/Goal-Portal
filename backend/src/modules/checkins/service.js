const db = require('../../db');
const { calcProgressScore } = require('../../utils/scoring');
const { sendMail } = require('../../utils/mailer');
const { assertCheckinWindowOpen } = require('../../utils/cycleRules');

async function getMyCheckins(employeeId, quarter) {
  const { rows } = await db.query(
    `SELECT 
        g.id AS goal_id,
        g.title,
        g.uom_type,
        g.target,
        g.deadline,
        g.weightage,
        g.thrust_area,
        c.id AS checkin_id,
        c.quarter,
        c.actual_achievement,
        c.progress_status,
        c.progress_score,
        c.completion_date,
        c.manager_comment,
        c.manager_commented_at
     FROM goals g
     LEFT JOIN checkins c 
       ON c.goal_id = g.id 
      AND c.quarter = $2
     WHERE g.employee_id = $1 
       AND g.status = 'locked'
     ORDER BY g.created_at`,
    [employeeId, quarter]
  );

  return rows;
}

async function submitCheckin(employeeId, data) {
  const goalId = data.goal_id || data.goalId;
  const quarter = data.quarter || 'Q1';
  const actualAchievement =
    data.actual_achievement ?? data.actualAchievement ?? null;
  const completionDate =
    data.completion_date ?? data.completionDate ?? null;
  const progressStatus =
    data.progress_status ?? data.progressStatus ?? 'Not Started';

  await assertCheckinWindowOpen(quarter);

  const { rows: [goal] } = await db.query(
    `SELECT *
     FROM goals
     WHERE id = $1
       AND employee_id = $2
       AND status = 'locked'`,
    [goalId, employeeId]
  );

  if (!goal) {
    throw new Error('Goal not found or not locked');
  }

  const score = calcProgressScore(
    goal.uom_type,
    parseFloat(goal.target),
    actualAchievement !== null ? parseFloat(actualAchievement) : null,
    goal.deadline,
    completionDate
  );

  const { rows: [checkin] } = await db.query(
    `INSERT INTO checkins (
        goal_id,
        employee_id,
        quarter,
        actual_achievement,
        completion_date,
        progress_status,
        progress_score
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (goal_id, quarter)
     DO UPDATE SET
       actual_achievement = $4,
       completion_date = $5,
       progress_status = $6,
       progress_score = $7,
       submitted_at = NOW()
     RETURNING *`,
    [
      goalId,
      employeeId,
      quarter,
      actualAchievement,
      completionDate,
      progressStatus,
      score,
    ]
  );

  const { rows: [employee] } = await db.query(
    `SELECT u.name, m.email AS manager_email, m.name AS manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.id = $1`,
    [employeeId]
  );

  if (employee?.manager_email) {
    await sendMail({
      to: employee.manager_email,
      subject: `Check-in Submitted (${quarter})`,
      text: `Hi ${employee.manager_name || 'Manager'}, ${employee.name} has submitted a ${quarter} check-in for goal "${goal.title}".`,
    });
  }

  return { ...checkin, progress_score: score };
}

async function getTeamCheckins(managerId, quarter) {
  const { rows } = await db.query(
    `SELECT 
        u.name AS employee_name,
        u.id AS employee_id,
        g.id AS goal_id,
        g.title,
        g.uom_type,
        g.target,
        g.weightage,
        c.quarter,
        c.actual_achievement,
        c.progress_status,
        c.progress_score,
        c.manager_comment,
        c.manager_commented_at,
        c.id AS checkin_id
     FROM users u
     JOIN goals g ON g.employee_id = u.id
     LEFT JOIN checkins c 
       ON c.goal_id = g.id 
      AND c.quarter = $2
     WHERE u.manager_id = $1 
       AND g.status = 'locked'
     ORDER BY u.name, g.title`,
    [managerId, quarter]
  );

  return rows;
}

async function addComment(checkinId, managerId, comment) {
  if (!comment || !comment.trim()) {
    throw new Error('Manager comment is required');
  }

  const { rows: [c] } = await db.query(
    `SELECT ch.*, g.title, g.employee_id, u.manager_id, e.email AS employee_email, e.name AS employee_name
     FROM checkins ch
     JOIN goals g ON ch.goal_id = g.id
     JOIN users u ON g.employee_id = u.id
     JOIN users e ON g.employee_id = e.id
     WHERE ch.id = $1
       AND u.manager_id = $2`,
    [checkinId, managerId]
  );

  if (!c) {
    throw new Error('Check-in not found or not authorized');
  }

  const { rows: [updated] } = await db.query(
    `UPDATE checkins
     SET manager_comment = $1,
         manager_commented_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [comment.trim(), checkinId]
  );

  if (c.employee_email) {
    await sendMail({
      to: c.employee_email,
      subject: 'Manager added check-in feedback',
      text: `Hi ${c.employee_name}, your manager added feedback for goal "${c.title}".`,
    });
  }

  return updated;
}

module.exports = {
  getMyCheckins,
  submitCheckin,
  getTeamCheckins,
  addComment,
};
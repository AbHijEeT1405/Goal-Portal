const db = require('../../db');
const { calcProgressScore } = require('../../utils/scoring');

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
        c.manager_comment
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

  console.log('submitCheckin payload received:', data);
  console.log('submitCheckin normalized:', {
    goalId,
    employeeId,
    quarter,
    actualAchievement,
    completionDate,
    progressStatus,
  });

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

  return { ...checkin, progress_score: score };
}

async function getTeamCheckins(managerId, quarter) {
  const { rows } = await db.query(
    `SELECT 
        u.name AS employee_name,
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
  const { rows: [c] } = await db.query(
    `SELECT ch.*
     FROM checkins ch
     JOIN goals g ON ch.goal_id = g.id
     JOIN users u ON g.employee_id = u.id
     WHERE ch.id = $1
       AND u.manager_id = $2`,
    [checkinId, managerId]
  );

  if (!c) {
    throw new Error('Check-in not found or not authorized');
  }

  const { rows: [updated] } = await db.query(
    `UPDATE checkins
     SET manager_comment = $1
     WHERE id = $2
     RETURNING *`,
    [comment, checkinId]
  );

  return updated;
}

module.exports = {
  getMyCheckins,
  submitCheckin,
  getTeamCheckins,
  addComment,
};
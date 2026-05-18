const db = require('../../db');
const audit = require('../../utils/audit');
const { sendMail } = require('../../utils/mailer');
const { assertGoalWindowOpen } = require('../../utils/cycleRules');

const GOAL_LIMIT = 8;
const ESCALATION_HOURS = 48;
const EMPLOYEE_EDITABLE_STATUSES = ['draft', 'returned'];
const SUBMITTABLE_STATUSES = ['draft', 'returned'];
const APPROVABLE_STATUSES = ['submitted'];
const RETURNABLE_STATUSES = ['submitted', 'locked'];

function isEmployeeEditable(status) {
  return EMPLOYEE_EDITABLE_STATUSES.includes(status);
}

async function runApprovalEscalationCheck() {
  const { rows: overdueGoals } = await db.query(
    `
    SELECT g.id, g.employee_id, g.title
    FROM goals g
    WHERE g.status = 'submitted'
      AND g.updated_at <= NOW() - ($1 || ' hours')::interval
      AND NOT EXISTS (
        SELECT 1
        FROM escalation_logs e
        WHERE e.goal_id = g.id
          AND e.type = 'manager_approval_timeout'
          AND e.resolved = false
      )
    `,
    [ESCALATION_HOURS]
  );

  for (const goal of overdueGoals) {
    await db.query(
      `
      INSERT INTO escalation_logs (employee_id, goal_id, type, message, resolved)
      VALUES ($1, $2, 'manager_approval_timeout', $3, false)
      `,
      [
        goal.employee_id,
        goal.id,
        `Goal "${goal.title}" is pending manager approval for more than ${ESCALATION_HOURS} hours.`,
      ]
    );
  }

  return overdueGoals.length;
}

async function getEscalatedGoalsForAdmin() {
  await runApprovalEscalationCheck();

  const { rows } = await db.query(
    `
    SELECT
      e.id AS escalation_id,
      e.message,
      e.created_at AS escalated_at,
      g.id AS goal_id,
      g.title,
      g.status,
      g.updated_at,
      u.name AS employee_name,
      u.email AS employee_email,
      m.name AS manager_name,
      m.email AS manager_email
    FROM escalation_logs e
    JOIN goals g ON e.goal_id = g.id
    JOIN users u ON g.employee_id = u.id
    LEFT JOIN users m ON u.manager_id = m.id
    WHERE e.type = 'manager_approval_timeout'
      AND e.resolved = false
    ORDER BY e.created_at DESC
    `
  );

  return rows;
}

async function getMyGoals(employeeId) {
  const { rows } = await db.query(
    `SELECT 
        g.*, 
        c.name AS cycle_name
     FROM goals g
     LEFT JOIN cycles c ON g.cycle_id = c.id
     WHERE g.employee_id = $1
     ORDER BY g.created_at DESC`,
    [employeeId]
  );

  return rows;
}

async function createGoal(employeeId, data) {
  await assertGoalWindowOpen();

  const {
    thrust_area,
    title,
    description,
    uom_type,
    target,
    deadline,
    weightage,
  } = data;

  const { rows: existing } = await db.query(
    `SELECT COUNT(*) 
     FROM goals 
     WHERE employee_id = $1`,
    [employeeId]
  );

  if (parseInt(existing[0].count, 10) >= GOAL_LIMIT) {
    throw new Error(`Maximum ${GOAL_LIMIT} goals allowed per employee`);
  }

  if (Number(weightage) < 10) {
    throw new Error('Minimum weightage per goal is 10%');
  }

  const { rows: [cycle] } = await db.query(
    `SELECT id 
     FROM cycles 
     WHERE is_active = true 
     LIMIT 1`
  );

  const { rows: [goal] } = await db.query(
    `INSERT INTO goals (
        employee_id,
        cycle_id,
        thrust_area,
        title,
        description,
        uom_type,
        target,
        deadline,
        weightage,
        status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
     RETURNING *`,
    [
      employeeId,
      cycle?.id || null,
      thrust_area,
      title,
      description,
      uom_type,
      target || null,
      deadline || null,
      weightage,
    ]
  );

  await audit.log({
    goalId: goal.id,
    changedBy: employeeId,
    action: 'created',
  });

  return goal;
}

async function updateGoal(goalId, employeeId, data) {
  await assertGoalWindowOpen();

  const { rows: [existing] } = await db.query(
    `SELECT * 
     FROM goals 
     WHERE id = $1 AND employee_id = $2`,
    [goalId, employeeId]
  );

  if (!existing) {
    throw new Error('Goal not found');
  }

  if (!isEmployeeEditable(existing.status)) {
    throw new Error('Goal cannot be edited in current status');
  }

  const {
    thrust_area,
    title,
    description,
    uom_type,
    target,
    deadline,
    weightage,
  } = data;

  if (Number(weightage) < 10) {
    throw new Error('Minimum weightage per goal is 10%');
  }

  const { rows: [goal] } = await db.query(
    `UPDATE goals
     SET thrust_area = $1,
         title = $2,
         description = $3,
         uom_type = $4,
         target = $5,
         deadline = $6,
         weightage = $7,
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      thrust_area,
      title,
      description,
      uom_type,
      target || null,
      deadline || null,
      weightage,
      goalId,
    ]
  );

  await audit.log({
    goalId,
    changedBy: employeeId,
    action: 'updated',
  });

  return goal;
}

async function deleteGoal(goalId, employeeId) {
  await assertGoalWindowOpen();

  const { rows: [existing] } = await db.query(
    `SELECT * 
     FROM goals 
     WHERE id = $1 AND employee_id = $2`,
    [goalId, employeeId]
  );

  if (!existing) {
    throw new Error('Goal not found');
  }

  if (!isEmployeeEditable(existing.status)) {
    throw new Error('Cannot delete a submitted or locked goal');
  }

  const { rows: [childUsage] } = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM checkins
     WHERE goal_id = $1`,
    [goalId]
  );

  if (childUsage.count > 0) {
    throw new Error('This goal cannot be deleted because check-ins already exist for it');
  }

  const result = await db.query(
    `DELETE FROM goals
     WHERE id = $1
       AND employee_id = $2
       AND status = ANY($3::text[])`,
    [goalId, employeeId, EMPLOYEE_EDITABLE_STATUSES]
  );

  if (result.rowCount === 0) {
    throw new Error('Goal could not be deleted');
  }

  await audit.log({
    goalId: null,
    changedBy: employeeId,
    action: 'deleted',
    oldVal: JSON.stringify({
      deleted_goal_id: existing.id,
      title: existing.title,
      status: existing.status,
      weightage: existing.weightage,
    }),
  });

  return { success: true };
}

async function submitGoals(employeeId) {
  await assertGoalWindowOpen();

  const { rows: editableGoals } = await db.query(
    `SELECT * 
     FROM goals 
     WHERE employee_id = $1 
       AND status = ANY($2::text[])`,
    [employeeId, SUBMITTABLE_STATUSES]
  );

  if (editableGoals.length === 0) {
    throw new Error('No goals to submit');
  }

  const { rows: allRelevantGoals } = await db.query(
    `SELECT *
     FROM goals
     WHERE employee_id = $1
       AND status = ANY($2::text[])`,
    [employeeId, ['draft', 'returned', 'submitted', 'locked']]
  );

  if (allRelevantGoals.length > GOAL_LIMIT) {
    throw new Error(`Maximum ${GOAL_LIMIT} goals allowed per employee`);
  }

  const hasInvalidWeightage = allRelevantGoals.some(
    (g) => Number(g.weightage) < 10
  );

  if (hasInvalidWeightage) {
    throw new Error('Each goal must have at least 10% weightage');
  }

  const total = allRelevantGoals.reduce(
    (sum, g) => sum + Number(g.weightage),
    0
  );

  if (Math.round(total) !== 100) {
    throw new Error(`Total weightage must equal 100%. Currently: ${total}%`);
  }

  await db.query(
    `UPDATE goals
     SET status = 'submitted',
         updated_at = NOW()
     WHERE employee_id = $1
       AND status = ANY($2::text[])`,
    [employeeId, SUBMITTABLE_STATUSES]
  );

  for (const g of editableGoals) {
    await audit.log({
      goalId: g.id,
      changedBy: employeeId,
      action: 'submitted',
    });
  }

  const { rows: [employee] } = await db.query(
    `SELECT u.name, u.email, m.email AS manager_email, m.name AS manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.id = $1`,
    [employeeId]
  );

  if (employee?.manager_email) {
    await sendMail({
      to: employee.manager_email,
      subject: 'Goals Submitted for Approval',
      text: `Hi ${employee.manager_name || 'Manager'}, ${employee.name} has submitted goals for your review.`,
    });
  }

  return { success: true };
}

async function getTeamGoals(managerId) {
  await runApprovalEscalationCheck();

  const { rows } = await db.query(
    `SELECT 
        g.*,
        u.name AS employee_name,
        u.email AS employee_email,
        EXISTS (
          SELECT 1
          FROM escalation_logs e
          WHERE e.goal_id = g.id
            AND e.type = 'manager_approval_timeout'
            AND e.resolved = false
        ) AS is_escalated
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     WHERE u.manager_id = $1
     ORDER BY is_escalated DESC, u.name, g.created_at DESC`,
    [managerId]
  );

  return rows;
}

async function approveGoal(goalId, managerId, comment) {
  const { rows: [goal] } = await db.query(
    `SELECT g.*
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     WHERE g.id = $1
       AND u.manager_id = $2`,
    [goalId, managerId]
  );

  if (!goal) {
    throw new Error('Goal not found or not authorized');
  }

  if (!APPROVABLE_STATUSES.includes(goal.status)) {
    throw new Error('Only submitted goals can be approved');
  }

  const { rows: [updated] } = await db.query(
    `UPDATE goals
     SET status = 'locked',
         manager_comment = $1,
         locked_at = NOW(),
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [comment || null, goalId]
  );

  await db.query(
    `UPDATE escalation_logs
     SET resolved = true
     WHERE goal_id = $1
       AND type = 'manager_approval_timeout'
       AND resolved = false`,
    [goalId]
  );

  await audit.log({
    goalId,
    changedBy: managerId,
    action: 'approved',
    newVal: 'locked',
  });

  const { rows: [employee] } = await db.query(
    `SELECT name, email FROM users WHERE id = $1`,
    [goal.employee_id]
  );

  if (employee?.email) {
    await sendMail({
      to: employee.email,
      subject: 'Goal Approved',
      text: `Hi ${employee.name}, your goal "${updated.title}" has been approved and locked.`,
    });
  }

  return updated;
}

async function returnGoal(goalId, managerId, comment) {
  const { rows: [goal] } = await db.query(
    `SELECT g.*
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     WHERE g.id = $1
       AND u.manager_id = $2`,
    [goalId, managerId]
  );

  if (!goal) {
    throw new Error('Goal not found or not authorized');
  }

  if (!RETURNABLE_STATUSES.includes(goal.status)) {
    throw new Error('Goal cannot be returned in current status');
  }

  const { rows: [updated] } = await db.query(
    `UPDATE goals
     SET status = 'returned',
         manager_comment = $1,
         locked_at = NULL,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [comment || '', goalId]
  );

  await db.query(
    `UPDATE escalation_logs
     SET resolved = true
     WHERE goal_id = $1
       AND type = 'manager_approval_timeout'
       AND resolved = false`,
    [goalId]
  );

  await audit.log({
    goalId,
    changedBy: managerId,
    action: 'returned',
    newVal: comment || '',
  });

  const { rows: [employee] } = await db.query(
    `SELECT name, email FROM users WHERE id = $1`,
    [goal.employee_id]
  );

  if (employee?.email) {
    await sendMail({
      to: employee.email,
      subject: 'Goal Returned for Rework',
      text: `Hi ${employee.name}, your goal "${updated.title}" was returned for rework.${comment ? ` Manager comment: ${comment}` : ''}`,
    });
  }

  return updated;
}

async function unlockGoal(goalId, adminId, reason) {
  const { rows: [goal] } = await db.query(
    `SELECT g.*, u.email, u.name
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     WHERE g.id = $1`,
    [goalId]
  );

  if (!goal) {
    throw new Error('Goal not found');
  }

  if (goal.status !== 'locked') {
    throw new Error('Goal is not locked');
  }

  const unlockReason = reason?.trim() || 'Admin exception';

  const { rows: [updated] } = await db.query(
    `UPDATE goals
     SET status = 'returned',
         locked_at = NULL,
         manager_comment = COALESCE(manager_comment, '') || $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [goalId, `\n[ADMIN UNLOCK] ${unlockReason}`]
  );

  await audit.log({
    goalId,
    changedBy: adminId,
    action: 'unlocked',
    newVal: unlockReason,
  });

  if (goal.email) {
    await sendMail({
      to: goal.email,
      subject: 'Goal unlocked by admin',
      text: `Hi ${goal.name}, your goal "${goal.title}" has been unlocked by admin. Reason: ${unlockReason}`,
    });
  }

  return updated;
}

module.exports = {
  getMyGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  submitGoals,
  getTeamGoals,
  approveGoal,
  returnGoal,
  unlockGoal,
  runApprovalEscalationCheck,
  getEscalatedGoalsForAdmin,
};
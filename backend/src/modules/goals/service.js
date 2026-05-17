const db = require('../../db');
const audit = require('../../utils/audit');

const GOAL_LIMIT = 8;
const EMPLOYEE_EDITABLE_STATUSES = ['draft', 'returned'];
const SUBMITTABLE_STATUSES = ['draft', 'returned'];
const APPROVABLE_STATUSES = ['submitted'];
const RETURNABLE_STATUSES = ['submitted', 'locked'];

function isEmployeeEditable(status) {
  return EMPLOYEE_EDITABLE_STATUSES.includes(status);
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

  await db.query(
    `DELETE FROM goals WHERE id = $1`,
    [goalId]
  );

  await audit.log({
    goalId,
    changedBy: employeeId,
    action: 'deleted',
  });

  return { success: true };
}

async function submitGoals(employeeId) {
  const { rows: goals } = await db.query(
    `SELECT * 
     FROM goals 
     WHERE employee_id = $1 
       AND status = ANY($2::text[])`,
    [employeeId, SUBMITTABLE_STATUSES]
  );

  if (goals.length === 0) {
    throw new Error('No goals to submit');
  }

  if (goals.length > GOAL_LIMIT) {
    throw new Error(`Maximum ${GOAL_LIMIT} goals allowed per employee`);
  }

  const hasInvalidWeightage = goals.some(
    (g) => Number(g.weightage) < 10
  );

  if (hasInvalidWeightage) {
    throw new Error('Each goal must have at least 10% weightage');
  }

  const total = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

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

  for (const g of goals) {
    await audit.log({
      goalId: g.id,
      changedBy: employeeId,
      action: 'submitted',
    });
  }

  return { success: true };
}

async function getTeamGoals(managerId) {
  const { rows } = await db.query(
    `SELECT 
        g.*,
        u.name AS employee_name,
        u.email AS employee_email
     FROM goals g
     JOIN users u ON g.employee_id = u.id
     WHERE u.manager_id = $1
     ORDER BY u.name, g.created_at DESC`,
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

  await audit.log({
    goalId,
    changedBy: managerId,
    action: 'approved',
    newVal: 'locked',
  });

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

  await audit.log({
    goalId,
    changedBy: managerId,
    action: 'returned',
    newVal: comment || '',
  });

  return updated;
}

async function unlockGoal(goalId, adminId) {
  const { rows: [goal] } = await db.query(
    `SELECT * 
     FROM goals 
     WHERE id = $1`,
    [goalId]
  );

  if (!goal) {
    throw new Error('Goal not found');
  }

  if (goal.status !== 'locked') {
    throw new Error('Goal is not locked');
  }

  const { rows: [updated] } = await db.query(
    `UPDATE goals
     SET status = 'returned',
         locked_at = NULL,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [goalId]
  );

  await audit.log({
    goalId,
    changedBy: adminId,
    action: 'unlocked',
    newVal: 'returned',
  });

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
};
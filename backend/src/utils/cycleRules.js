const db = require('../db');

function getTodayISTDateString() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date());
}

function toDateOnly(value) {
  if (!value) return null;
  return new Date(value).toISOString().slice(0, 10);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isDateInRange(today, start, end) {
  return today >= start && today <= end;
}

async function getActiveCycleOrThrow() {
  const { rows } = await db.query(
    `SELECT *
     FROM cycles
     WHERE is_active = true
     ORDER BY created_at DESC
     LIMIT 1`
  );

  const cycle = rows[0];

  if (!cycle) {
    throw new Error('No active cycle configured');
  }

  return cycle;
}

async function assertGoalWindowOpen() {
  const cycle = await getActiveCycleOrThrow();
  const today = getTodayISTDateString();
  const goalOpenDate = toDateOnly(cycle.goal_setting_opens);

  if (!goalOpenDate) {
    throw new Error('Goal setting window is not configured in active cycle');
  }

  const goalCloseDate = addDays(goalOpenDate, 30);

  if (!isDateInRange(today, goalOpenDate, goalCloseDate)) {
    throw new Error(
      `Goal setting window is closed. Allowed: ${goalOpenDate} to ${goalCloseDate}.`
    );
  }
}

async function assertCheckinWindowOpen(quarter) {
  const cycle = await getActiveCycleOrThrow();
  const today = getTodayISTDateString();

  const quarterMap = {
    Q1: cycle.q1_opens,
    Q2: cycle.q2_opens,
    Q3: cycle.q3_opens,
    Q4: cycle.q4_opens,
  };

  const openDateRaw = quarterMap[quarter];

  if (!openDateRaw) {
    throw new Error(`${quarter} window is not configured in active cycle`);
  }

  const openDate = toDateOnly(openDateRaw);
  const closeDate = addDays(openDate, 30);

  if (!isDateInRange(today, openDate, closeDate)) {
    throw new Error(
      `${quarter} check-in window is closed. Allowed: ${openDate} to ${closeDate}.`
    );
  }
}

module.exports = {
  assertGoalWindowOpen,
  assertCheckinWindowOpen,
};
const db = require('./index');

async function migrate() {
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK (role IN ('employee','manager','admin')) NOT NULL,
      manager_id UUID REFERENCES users(id),
      department TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cycles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      goal_setting_opens DATE,
      q1_opens DATE,
      q2_opens DATE,
      q3_opens DATE,
      q4_opens DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS goals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES users(id) NOT NULL,
      cycle_id UUID REFERENCES cycles(id),
      thrust_area TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      uom_type TEXT CHECK (uom_type IN ('min','max','timeline','zero')) NOT NULL,
      target NUMERIC,
      deadline DATE,
      weightage NUMERIC NOT NULL CHECK (weightage >= 10),
      status TEXT CHECK (status IN ('draft','submitted','approved','locked','returned')) DEFAULT 'draft',
      is_shared BOOLEAN DEFAULT false,
      primary_owner_id UUID REFERENCES users(id),
      manager_comment TEXT,
      locked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id UUID REFERENCES goals(id) NOT NULL,
      employee_id UUID REFERENCES users(id) NOT NULL,
      quarter TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')) NOT NULL,
      actual_achievement NUMERIC,
      completion_date DATE,
      progress_status TEXT CHECK (progress_status IN ('not_started','on_track','completed')) DEFAULT 'not_started',
      progress_score NUMERIC,
      manager_comment TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(goal_id, quarter)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      goal_id UUID REFERENCES goals(id),
      changed_by UUID REFERENCES users(id) NOT NULL,
      action TEXT NOT NULL,
      field_changed TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Migration complete');
}

migrate().catch(console.error).finally(() => process.exit());
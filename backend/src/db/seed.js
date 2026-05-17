const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  const hash = (p) => bcrypt.hash(p, 10);

  // Admin
  const adminHash = await hash('admin123');
  const { rows: [admin] } = await db.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('HR Admin', 'admin@atomberg.com', $1, 'admin', 'HR')
    ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  `, [adminHash]);

  // Manager
  const managerHash = await hash('manager123');
  const { rows: [manager] } = await db.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('Rahul Manager', 'manager@atomberg.com', $1, 'manager', 'Sales')
    ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name
    RETURNING id
  `, [managerHash]);

  // Employee
  const empHash = await hash('employee123');
  await db.query(`
    INSERT INTO users (name, email, password_hash, role, manager_id, department)
    VALUES ('Priya Employee', 'employee@atomberg.com', $1, 'employee', $2, 'Sales')
    ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name
  `, [empHash, manager.id]);

  // Active Cycle
  await db.query(`
    INSERT INTO cycles (name, goal_setting_opens, q1_opens, q2_opens, q3_opens, q4_opens, is_active)
    VALUES ('FY 2026-27', '2026-05-01', '2026-07-01', '2026-10-01', '2027-01-01', '2027-03-01', true)
    ON CONFLICT DO NOTHING
  `);

  console.log('✅ Seed complete');
  console.log('Demo credentials:');
  console.log('  employee@atomberg.com / employee123');
  console.log('  manager@atomberg.com  / manager123');
  console.log('  admin@atomberg.com    / admin123');
}

seed().catch(console.error).finally(() => process.exit());
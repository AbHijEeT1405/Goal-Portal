const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roles');
const ctrl = require('./controller');

// Employee routes
router.get('/my', auth, role('employee'), ctrl.getMyGoals);
router.post('/submit', auth, role('employee'), ctrl.submitGoals);
router.post('/', auth, role('employee'), ctrl.createGoal);
router.put('/:id', auth, role('employee'), ctrl.updateGoal);
router.delete('/:id', auth, role('employee'), ctrl.deleteGoal);

// Manager routes
router.get('/team', auth, role('manager'), ctrl.getTeamGoals);
router.put('/:id/approve', auth, role('manager'), ctrl.approveGoal);
router.put('/:id/return', auth, role('manager'), ctrl.returnGoal);

// Admin routes
router.put('/:id/unlock', auth, role('admin'), ctrl.unlockGoal);
router.get('/admin/escalations', auth, role('admin'), ctrl.getEscalatedGoalsForAdmin);
router.post('/admin/escalations/run', auth, role('admin'), ctrl.runApprovalEscalationCheck);

module.exports = router;
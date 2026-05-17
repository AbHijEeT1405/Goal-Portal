const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roles');
const ctrl = require('./controller');

router.get('/achievement', auth, role('admin', 'manager'), ctrl.achievementReport);
router.get('/completion', auth, role('admin', 'manager'), ctrl.completionDashboard);
router.get('/audit', auth, role('admin'), ctrl.auditLogs);
router.get('/analytics', auth, role('admin'), ctrl.getAnalytics);
module.exports = router;
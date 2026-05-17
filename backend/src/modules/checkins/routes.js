const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roles');
const ctrl = require('./controller');

router.get('/my', auth, role('employee'), ctrl.getMyCheckins);
router.post('/', auth, role('employee'), ctrl.submitCheckin);
router.get('/team', auth, role('manager'), ctrl.getTeamCheckins);
router.put('/:id/comment', auth, role('manager'), ctrl.addComment);
module.exports = router;
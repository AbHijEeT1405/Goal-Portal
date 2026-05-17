const router = require('express').Router();
const auth = require('../../middleware/auth');
const role = require('../../middleware/roles');
const ctrl = require('./controller');

router.get('/', auth, ctrl.getActiveCycle);
router.get('/all', auth, role('admin'), ctrl.getAllCycles);
router.post('/', auth, role('admin'), ctrl.createCycle);
router.put('/:id', auth, role('admin'), ctrl.updateCycle);
module.exports = router;
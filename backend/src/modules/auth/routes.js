const router = require('express').Router();
const ctrl = require('./controller');
router.post('/login', ctrl.login);
router.post('/microsoft-login', ctrl.microsoftLogin);
module.exports = router;
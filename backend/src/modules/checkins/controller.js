const svc = require('./service');
const handle = (fn) => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (err) { res.status(400).json({ error: err.message }); }
};

exports.getMyCheckins = handle((req) => svc.getMyCheckins(req.user.id, req.query.quarter || 'Q1'));
exports.submitCheckin = handle((req) => svc.submitCheckin(req.user.id, req.body));
exports.getTeamCheckins = handle((req) => svc.getTeamCheckins(req.user.id, req.query.quarter || 'Q1'));
exports.addComment = handle((req) => svc.addComment(req.params.id, req.user.id, req.body.comment));
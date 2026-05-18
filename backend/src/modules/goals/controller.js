const svc = require('./service');

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMyGoals = handle((req) => svc.getMyGoals(req.user.id));
exports.createGoal = handle((req) => svc.createGoal(req.user.id, req.body));
exports.updateGoal = handle((req) => svc.updateGoal(req.params.id, req.user.id, req.body));
exports.deleteGoal = handle(async (req) => {
  await svc.deleteGoal(req.params.id, req.user.id);
  return { success: true };
});
exports.submitGoals = handle(async (req) => {
  await svc.submitGoals(req.user.id);
  return { success: true };
});
exports.getTeamGoals = handle((req) => svc.getTeamGoals(req.user.id));
exports.approveGoal = handle((req) => svc.approveGoal(req.params.id, req.user.id, req.body.comment));
exports.returnGoal = handle((req) => svc.returnGoal(req.params.id, req.user.id, req.body.comment));
exports.unlockGoal = handle((req) => svc.unlockGoal(req.params.id, req.user.id, req.body.reason));

exports.getEscalatedGoalsForAdmin = handle(() => svc.getEscalatedGoalsForAdmin());

exports.runApprovalEscalationCheck = handle(async () => {
  const count = await svc.runApprovalEscalationCheck();
  return { success: true, escalatedCount: count };
});
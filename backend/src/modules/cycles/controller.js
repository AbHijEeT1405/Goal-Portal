const svc = require('./service');

const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getActiveCycle = handle(() => svc.getActiveCycle());
exports.getAllCycles = handle(() => svc.getAllCycles());
exports.createCycle = handle((req) => svc.createCycle(req.body));
exports.updateCycle = handle((req) => svc.updateCycle(req.params.id, req.body));
exports.activateCycle = handle((req) => svc.activateCycle(req.params.id));
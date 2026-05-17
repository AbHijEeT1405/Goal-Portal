const svc = require('./service');
const { stringify } = require('csv-stringify/sync');

exports.achievementReport = async (req, res) => {
  try {
    const rows = await svc.achievementReport(req.query.quarter);
    if (req.query.format === 'csv') {
      const csv = stringify(rows, { header: true });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=achievement_report.csv');
      return res.send(csv);
    }
    res.json(rows);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

exports.completionDashboard = async (req, res) => {
  try { res.json(await svc.completionDashboard()); }
  catch (err) { res.status(400).json({ error: err.message }); }
};

exports.auditLogs = async (req, res) => {
  try { res.json(await svc.auditLogs(req.query.limit)); }
  catch (err) { res.status(400).json({ error: err.message }); }
};
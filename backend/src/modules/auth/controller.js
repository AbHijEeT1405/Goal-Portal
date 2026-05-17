const service = require('./service');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });
    const data = await service.login(email, password);
    res.json(data);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
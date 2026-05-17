const express = require('express');
const cors = require('cors');
const { PORT, FRONTEND_URL } = require('./config/env');

const app = express();

app.use(cors({ origin: [FRONTEND_URL, 'http://localhost:5173'], credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Routes
app.use('/api/auth', require('./modules/auth/routes'));
app.use('/api/goals', require('./modules/goals/routes'));
app.use('/api/checkins', require('./modules/checkins/routes'));
app.use('/api/cycles', require('./modules/cycles/routes'));
app.use('/api/reports', require('./modules/reports/routes'));

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
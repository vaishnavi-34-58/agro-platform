require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { startScheduledJobs } = require('./utils/scheduledJobs');

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Netlify functions)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: 'Too many requests' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Routes
app.use('/api/public', require('./routes/public'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/farmer', require('./routes/farmer'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🌱 AgroSeq Server running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/health`);
    console.log('\n📋 Default Credentials:');
    console.log('   Super Admin: phone=9999999999, password=Admin@123');
    console.log('   Manager:     phone=8888888888, password=Manager@123\n');
    // Start background scheduled jobs (farm visit reminders etc.)
    startScheduledJobs();
  });
}

module.exports = app;

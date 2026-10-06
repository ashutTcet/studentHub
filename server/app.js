const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const academicRecordRoutes = require('./routes/academicRecordRoutes');
const projectRoutes = require('./routes/projectRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const competitionRoutes = require('./routes/competitionRoutes');
const activityRoutes = require('./routes/activityRoutes');
const fileRoutes = require('./routes/fileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const directoryRoutes = require('./routes/directoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const env = require('./config/env');
const { isRedisReady } = require('./config/redis');
const { requestContext } = require('./middleware/requestContext');
const { requestLogger } = require('./middleware/requestLogger');
const { requestTimeout, haltOnTimedout } = require('./middleware/timeoutHandler');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers');
const {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  expensiveSearchLimiter,
  reportLimiter,
  verificationLimiter,
  notificationLimiter,
} = require('./middleware/rateLimiter');

const app = express();
const allowedOrigins = String(env.clientUrl || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(requestContext);
app.use(requestLogger);
app.use(requestTimeout);
app.use(haltOnTimedout);
app.use(helmet());
app.use(compression());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'studenthub-api',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/live', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/health/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  const redisReady = isRedisReady();

  if (!dbReady) {
    return res.status(503).json({ ok: false, db: 'down', redis: redisReady ? 'up' : 'down' });
  }

  return res.status(200).json({ ok: true, db: 'up', redis: redisReady ? 'up' : 'down' });
});

app.use(globalLimiter);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(cookieParser());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', profileRoutes);
app.use('/api', academicRecordRoutes);
app.use('/api', projectRoutes);
app.use('/api', internshipRoutes);
app.use('/api', certificateRoutes);
app.use('/api', achievementRoutes);
app.use('/api', competitionRoutes);
app.use('/api', activityRoutes);
app.use('/api', fileRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', notificationLimiter, notificationRoutes);
app.use('/api', reportLimiter, reportRoutes);
app.use('/api/faculty', verificationLimiter, facultyRoutes);
app.use('/api', expensiveSearchLimiter, directoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

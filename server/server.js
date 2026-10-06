require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { connectDB, closeDB } = require('./config/db');
const env = require('./config/env');
const logger = require('./config/logger');
const { initRedis, closeRedis } = require('./config/redis');

const PORT = env.port;

let httpServer;
let shuttingDown = false;
let appInstance;

const shutdown = (exitSignalCallback) => {
  if (shuttingDown) return;
  shuttingDown = true;

  const finish = async () => {
    try {
      await closeDB();
      await closeRedis();
    } catch (error) {
      logger.error({ error: error.message }, 'Error while closing infrastructure connections');
    }

    if (typeof exitSignalCallback === 'function') {
      exitSignalCallback();
      return;
    }

    process.exit(0);
  };

  if (!httpServer) {
    finish();
    return;
  }

  httpServer.close(() => {
    finish();
  });

  setTimeout(() => {
    process.exit(1);
  }, 5000).unref();
};

const start = async () => {
  try {
    await connectDB();
    await initRedis();
    appInstance = require('./app');

    httpServer = appInstance.listen(PORT, () => {
      logger.info(`StudentHub API running on http://localhost:${PORT}`);
    });

    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          { port: PORT },
          `Port ${PORT} is already in use. Stop the existing process or change PORT.`
        );
      } else {
        logger.error({ error: error.message }, 'Server failed to start');
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to initialize server. MongoDB connection was not established.');
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
process.once('SIGUSR2', () => shutdown(() => process.kill(process.pid, 'SIGUSR2')));
process.on('unhandledRejection', (error) => {
  logger.error({ error: error?.message || String(error) }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (error) => {
  logger.error({ error: error?.message || String(error) }, 'Uncaught exception');
  shutdown(() => process.exit(1));
});

start();

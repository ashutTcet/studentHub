const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const env = require('./env');
const logger = require('./logger');

let memoryServer;

const connectDB = async () => {
  const mongoUri = env.mongoUri;

  const commonOptions = {
    maxPoolSize: env.mongoMaxPoolSize,
    minPoolSize: env.mongoMinPoolSize,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    socketTimeoutMS: env.mongoSocketTimeoutMs,
  };

  if (mongoUri) {
    await mongoose.connect(mongoUri, commonOptions);
    logger.info('Connected to MongoDB');
    return;
  }

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'studenthub-dev',
    },
  });

  const uri = memoryServer.getUri();
  await mongoose.connect(uri, commonOptions);
  logger.info('Connected to in-memory MongoDB for StudentHub development');
};

const closeDB = async () => {
  await mongoose.connection.close();

  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };

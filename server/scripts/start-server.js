const net = require('net');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_PORT = 5000;

const parsePort = (value, fallback) => {
  const port = Number.parseInt(value, 10);
  return Number.isFinite(port) && port > 0 ? port : fallback;
};

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });

const start = async () => {
  const requestedPort = parsePort(process.env.PORT, DEFAULT_PORT);

  const available = await isPortAvailable(requestedPort);
  if (!available) {
    console.error(`Port ${requestedPort} is in use. Stop the existing process or set PORT.`);
    process.exit(1);
  }

  process.env.PORT = String(requestedPort);
  require(path.resolve(__dirname, '../server.js'));
};

start();

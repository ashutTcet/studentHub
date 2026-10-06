const net = require('net');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const DEFAULT_PORT = 5000;
const configuredPort = Number(process.env.PORT) || DEFAULT_PORT;

const formatPort = (port) => String(port || DEFAULT_PORT);

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const server = net.createServer();

server.once('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    fail(`Port ${formatPort(configuredPort)} is already in use. Stop the existing process or set PORT to a different value.`);
    return;
  }

  fail(`Unable to check port ${formatPort(configuredPort)}: ${error.message}`);
});

server.once('listening', () => {
  server.close(() => {
    process.exit(0);
  });
});

server.listen(configuredPort);

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');
const connectDatabase = require('./config/database');
const { port } = require('./config/env');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

const shutdown = async (signal) => {
  try {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error(`Unable to shut down cleanly after ${signal}:`, error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

connectDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err.message);
  });

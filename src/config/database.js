const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDatabase = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};

module.exports = connectDatabase;

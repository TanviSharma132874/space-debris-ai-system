const mongoose = require('mongoose');
require('dotenv').config();

let connectionPromise;

mongoose.connection.on('disconnected', () => {
  console.log('[database] MongoDB disconnected');
});

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const message = 'MongoDB connection string is missing. Set MONGO_URI in .env.';
    console.error(`[database] ${message}`);
    throw new Error(message);
  }

  if (mongoose.connection.readyState === 1) {
    console.log('[database] MongoDB already connected');
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(mongoUri)
    .then((mongooseInstance) => {
      console.log(`[database] MongoDB connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance.connection;
    })
    .catch((error) => {
      connectionPromise = undefined;
      console.error(`[database] MongoDB connection failed: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDatabase;

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const dbState = {
  isConnected: false,
  uriConfigured: false,
  error: null,
  databaseName: null,
  host: null
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri || uri.trim() === '') {
    dbState.isConnected = false;
    dbState.uriConfigured = false;
    dbState.error = 'MONGODB_URI (or MONGO_URI) is not set in environment (.env). Database features will be unavailable until configured.';
    logger.warn(dbState.error);
    return false;
  }

  dbState.uriConfigured = true;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000
    });

    dbState.isConnected = true;
    dbState.error = null;
    dbState.databaseName = conn.connection.name;
    dbState.host = conn.connection.host;

    logger.info(`MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    dbState.isConnected = false;
    dbState.error = error.message;
    logger.error('MongoDB Atlas Connection Error:', error.message);
    return false;
  }
};

mongoose.connection.on('error', (err) => {
  dbState.isConnected = false;
  dbState.error = err.message;
  logger.warn('MongoDB connection error event caught safely:', err.message);
});

mongoose.connection.on('disconnected', () => {
  dbState.isConnected = false;
  logger.warn('MongoDB connection lost (will auto-reconnect)');
});

mongoose.connection.on('reconnected', () => {
  dbState.isConnected = true;
  dbState.error = null;
  logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('close', () => {
  dbState.isConnected = false;
  logger.warn('MongoDB connection closed');
});

import mongoose from 'mongoose';
import { defaultLogger as logger } from '../utils/logger.js';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      // Connection pooling configuration
      maxPoolSize: 10,        // Maximum number of connections in the pool
      minPoolSize: 2,         // Minimum number of connections to maintain
      maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000,  // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
      connectTimeoutMS: 10000, // How long to wait for a connection to be established
      heartbeatFrequencyMS: 10000, // How often to check server status

      // Additional optimizations
      bufferCommands: false,  // Disable mongoose buffering
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`, {
      readyState: conn.connection.readyState,
    });

    // Connection pool event monitoring
    mongoose.connection.on('connectionPoolCreated', (event) => {
      logger.info('[MongoDB] Connection pool created', {
        maxPoolSize: event.options?.maxPoolSize,
        minPoolSize: event.options?.minPoolSize,
      });
    });

    mongoose.connection.on('connectionCreated', (event) => {
      logger.debug('[MongoDB] Connection created', {
        connectionId: event.connectionId,
      });
    });

    mongoose.connection.on('connectionClosed', (event) => {
      logger.debug('[MongoDB] Connection closed', {
        connectionId: event.connectionId,
        reason: event.reason,
      });
    });

    mongoose.connection.on('connectionPoolCleared', (event) => {
      logger.warn('[MongoDB] Connection pool cleared', {
        reason: event.reason,
      });
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error connecting to MongoDB', { error: message });
    
    if (message.includes('IP whitelist')) {
      logger.error('\n🔒 MongoDB Atlas IP Whitelist Issue Detected!');
      logger.error('Your IP address is not whitelisted in MongoDB Atlas.');
      logger.error('\nTo fix this:');
      logger.error('1. Go to https://cloud.mongodb.com/');
      logger.error('2. Navigate to your cluster (Cluster0)');
      logger.error('3. Click "Network Access" in the left sidebar');
      logger.error('4. Click "Add IP Address"');
      logger.error('5. For development, click "Allow Access from Anywhere" (0.0.0.0/0)');
      logger.error('6. Wait 1-2 minutes for changes to propagate\n');

      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        logger.error(`📍 Your current IP address: ${data.ip}`);
      } catch {
        logger.error('📍 Could not determine your current IP address');
      }
    }
    
    throw error; // Don't exit process, let application handle the error
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('[MongoDB] Connection closed gracefully');
  } catch (error) {
    logger.error('[MongoDB] Error during graceful shutdown', error);
  }
};
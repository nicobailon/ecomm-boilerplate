import mongoose from 'mongoose';
import { defaultLogger as logger } from '../utils/logger.js';

// Setup comprehensive connection event listeners
const setupConnectionEventListeners = (): void => {
  const connection = mongoose.connection;
  
  // Connection lifecycle events
  connection.on('connecting', () => {
    logger.info('[MongoDB] Attempting to connect to database...');
  });
  
  connection.on('connected', () => {
    logger.info('[MongoDB] Successfully connected to database');
  });
  
  connection.on('error', (error) => {
    logger.error('[MongoDB] Connection error:', {
      error: error.message,
      stack: error.stack,
    });
  });
  
  connection.on('disconnected', () => {
    logger.warn('[MongoDB] Disconnected from database');
  });
  
  connection.on('reconnected', () => {
    logger.info('[MongoDB] Successfully reconnected to database');
  });
  
  connection.on('reconnectFailed', () => {
    logger.error('[MongoDB] Failed to reconnect to database after multiple attempts');
  });
  
  // Additional monitoring events
  connection.on('close', () => {
    logger.info('[MongoDB] Connection closed');
  });
  
  connection.on('all', () => {
    logger.debug('[MongoDB] Replica set state: all servers connected');
  });
  
  connection.on('fullsetup', () => {
    logger.info('[MongoDB] Replica set fully connected');
  });
};

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  
  // Set up comprehensive connection event listeners before connecting
  setupConnectionEventListeners();
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      // Connection pooling configuration
      maxPoolSize: 10,        // Maximum number of connections in the pool
      minPoolSize: 2,         // Minimum number of connections to maintain
      maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
      
      // Retry and timeout configuration (explicit for clarity)
      serverSelectionTimeoutMS: 5000,  // How long to try selecting a server (default: 30000)
      socketTimeoutMS: 45000,          // How long a send or receive on a socket can take (default: 0)
      connectTimeoutMS: 10000,         // How long to wait for a connection to be established (default: 30000)
      heartbeatFrequencyMS: 10000,     // How often to check server status (default: 10000)
      
      // Retry behavior (Mongoose handles retries internally)
      retryWrites: true,               // Retry writes on network errors (default: true)
      retryReads: true,                // Retry reads on network errors (default: true)

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
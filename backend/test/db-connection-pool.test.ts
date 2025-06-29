import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../lib/db.js';

describe('MongoDB Connection Pooling', () => {
  beforeAll(async () => {
    // Ensure we start with a clean connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should connect with proper pooling configuration', async () => {
    await connectDB();
    
    const connection = mongoose.connection;
    expect(connection.readyState).toBe(1); // Connected
    
    // Check that connection options are properly set
    const client = connection.getClient();
    const options = client.options;
    
    // Verify pooling options
    expect(options.maxPoolSize).toBe(10);
    expect(options.minPoolSize).toBe(2);
    expect(options.maxIdleTimeMS).toBe(30000);
    expect(options.serverSelectionTimeoutMS).toBe(5000);
    expect(options.socketTimeoutMS).toBe(45000);
    expect(options.connectTimeoutMS).toBe(10000);
    expect(options.heartbeatFrequencyMS).toBe(10000);
  });

  it('should handle graceful disconnection', async () => {
    // Ensure connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    
    expect(mongoose.connection.readyState).toBe(1);
    
    await disconnectDB();
    
    expect(mongoose.connection.readyState).toBe(0); // Disconnected
  });

  it('should handle connection errors without exiting process', async () => {
    // Save original env
    const originalUri = process.env.MONGO_URI;
    
    // Set invalid URI
    process.env.MONGO_URI = 'mongodb://invalid-host:27017/test';
    
    // Should throw error but not exit process
    await expect(connectDB()).rejects.toThrow();
    
    // Process should still be running
    expect(process.exitCode).toBeUndefined();
    
    // Restore original URI
    process.env.MONGO_URI = originalUri;
  }, 10000); // Increase timeout to 10 seconds
});
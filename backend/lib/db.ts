import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error connecting to MONGODB', message);
    
    if (message.includes('IP whitelist')) {
      console.error('\n🔒 MongoDB Atlas IP Whitelist Issue Detected!');
      console.error('Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('\nTo fix this:');
      console.error('1. Go to https://cloud.mongodb.com/');
      console.error('2. Navigate to your cluster (Cluster0)');
      console.error('3. Click "Network Access" in the left sidebar');
      console.error('4. Click "Add IP Address"');
      console.error('5. For development, click "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('6. Wait 1-2 minutes for changes to propagate\n');
      
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        console.error(`📍 Your current IP address: ${data.ip}`);
      } catch {
        console.error('📍 Could not determine your current IP address');
      }
    }
    
    process.exit(1);
  }
};
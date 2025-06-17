import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const listUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({}, 'email role createdAt').lean();

    if (users.length === 0) {
      console.log('No users found in the database');
      process.exit(0);
    }

    console.log(`Found ${users.length} users:\n`);
    console.log('Email                          | Role     | Created');
    console.log('---------------------------------------------------');
    
    users.forEach((user: any) => {
      const email = user.email.padEnd(30);
      const role = (user.role || 'customer').padEnd(8);
      const created = new Date(user.createdAt).toLocaleDateString();
      console.log(`${email} | ${role} | ${created}`);
    });

    const adminCount = users.filter((u: any) => u.role === 'admin').length;
    console.log(`\n📊 Summary: ${adminCount} admin(s), ${users.length - adminCount} customer(s)`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

listUsers();
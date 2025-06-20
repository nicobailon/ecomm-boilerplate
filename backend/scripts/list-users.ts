import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const listUsers = async (): Promise<void> => {
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.warn('✅ Connected to MongoDB\n');

    const users = await User.find({}, 'email role createdAt').lean();
    
    interface UserProjection {
      email: string;
      role?: string;
      createdAt: Date;
    }

    if (users.length === 0) {
      console.warn('No users found in the database');
      process.exit(0);
    }

    console.warn(`Found ${users.length} users:\n`);
    console.warn('Email                          | Role     | Created');
    console.warn('---------------------------------------------------');
    
    users.forEach((user) => {
      const userTyped = user as unknown as UserProjection;
      const email = userTyped.email.padEnd(30);
      const role = (userTyped.role ?? 'customer').padEnd(8);
      const created = new Date(userTyped.createdAt).toLocaleDateString();
      console.warn(`${email} | ${role} | ${created}`);
    });

    const adminCount = users.filter(u => (u as unknown as UserProjection).role === 'admin').length;
    console.warn(`\n📊 Summary: ${adminCount} admin(s), ${users.length - adminCount} customer(s)`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.warn('\n✅ Disconnected from MongoDB');
  }
};

void listUsers();
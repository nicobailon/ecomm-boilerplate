import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const makeAdmin = async (): Promise<void> => {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.warn('Usage: npm run make-admin <email>');
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.warn('✅ Connected to MongoDB');

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.warn('\nExisting users:');
      const users = await User.find({}, 'email role').lean();
      users.forEach((u) => {
        console.warn(`  - ${u.email} (${u.role})`);
      });
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.warn(`ℹ️  User "${email}" is already an admin`);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.warn(`✅ Successfully promoted "${email}" to admin`);
    console.warn('\nCurrent admins:');
    const admins = await User.find({ role: 'admin' }, 'email').lean() as { email: string }[];
    admins.forEach((admin) => {
      console.warn(`  - ${admin.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.warn('\n✅ Disconnected from MongoDB');
  }
};

void makeAdmin();
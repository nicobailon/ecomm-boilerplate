import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: npm run make-admin <email>');
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI not found in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.log('\nExisting users:');
      const users = await User.find({}, 'email role').lean();
      users.forEach((u: any) => {
        console.log(`  - ${u.email} (${u.role})`);
      });
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${email}" is already an admin`);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ Successfully promoted "${email}" to admin`);
    console.log('\nCurrent admins:');
    const admins = await User.find({ role: 'admin' }, 'email').lean();
    admins.forEach((admin: any) => {
      console.log(`  - ${admin.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

makeAdmin();
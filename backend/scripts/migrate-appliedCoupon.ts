import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model.js';

dotenv.config();

const migrateAppliedCoupon = async (): Promise<void> => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error('MONGO_URI environment variable is not set');
      process.exit(1);
    }

    console.warn('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.warn('Connected to MongoDB');

    console.warn('Starting migration to add appliedCoupon field to users...');
    
    const result = await User.updateMany(
      { appliedCoupon: { $exists: false } },
      { $set: { appliedCoupon: null } },
    );

    console.warn('Migration completed successfully!');
    console.warn(`Updated ${result.modifiedCount} users with appliedCoupon: null`);
    console.warn(`${result.matchedCount} users matched the criteria`);

    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.warn('\nSample user after migration:');
      console.warn('- ID:', sampleUser._id);
      console.warn('- Email:', sampleUser.email);
      console.warn('- Applied Coupon:', sampleUser.appliedCoupon);
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

void migrateAppliedCoupon();
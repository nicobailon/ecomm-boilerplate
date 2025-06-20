import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Coupon } from '../models/coupon.model.js';

dotenv.config();

async function deactivateCoupon(): Promise<void> {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.warn('Connected to MongoDB');

    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error('Usage: npm run deactivate-coupon <code>');
      console.error('Example: npm run deactivate-coupon SUMMER20');
      process.exit(1);
    }

    const [code] = args;

    const coupon = await Coupon.findOne({ code });
    
    if (!coupon) {
      console.error(`Coupon with code "${code}" not found`);
      process.exit(1);
    }

    if (!coupon.isActive) {
      console.warn(`Coupon "${code}" is already inactive`);
      process.exit(0);
    }

    coupon.isActive = false;
    await coupon.save();

    console.warn('\n✅ Coupon deactivated successfully!');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn(`Code: ${coupon.code}`);
    console.warn('Status: Inactive');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error deactivating coupon:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

void deactivateCoupon();
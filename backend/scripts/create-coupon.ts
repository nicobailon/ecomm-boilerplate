import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Coupon } from '../models/coupon.model.js';
import { User } from '../models/user.model.js';

dotenv.config();

async function createCoupon() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error('Usage: npm run create-coupon <email> [discountPercentage] [expirationDays] [code]');
      console.error('Example: npm run create-coupon user@example.com 20 30 SUMMER20');
      console.error('Defaults: discountPercentage=10, expirationDays=30, code=auto-generated');
      process.exit(1);
    }

    const [email, discountStr, daysStr, customCode] = args;
    const discountPercentage = discountStr ? parseInt(discountStr) : 10;
    const expirationDays = daysStr ? parseInt(daysStr) : 30;

    if (discountPercentage < 0 || discountPercentage > 100) {
      console.error('Discount percentage must be between 0 and 100');
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const existingCoupon = await Coupon.findOne({ userId: user._id, isActive: true });
    if (existingCoupon) {
      console.log(`User already has an active coupon: ${existingCoupon.code}`);
      console.log('Do you want to deactivate it and create a new one? (yes/no)');
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise<string>((resolve) => {
        rl.question('', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('Operation cancelled');
        process.exit(0);
      }

      existingCoupon.isActive = false;
      await existingCoupon.save();
      console.log(`Deactivated existing coupon: ${existingCoupon.code}`);
    }

    const code = customCode || `GIFT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expirationDate = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    const newCoupon = new Coupon({
      code,
      discountPercentage,
      expirationDate,
      userId: user._id,
      isActive: true
    });

    await newCoupon.save();

    console.log('\n✅ Coupon created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Code: ${newCoupon.code}`);
    console.log(`Discount: ${newCoupon.discountPercentage}%`);
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Expires: ${expirationDate.toLocaleDateString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error creating coupon:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createCoupon();
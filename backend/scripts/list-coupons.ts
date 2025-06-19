import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Coupon, ICouponDocument } from '../models/coupon.model.js';
import { User, IUserDocument } from '../models/user.model.js';

dotenv.config();

async function listCoupons(): Promise<void> {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const args = process.argv.slice(2);
    const filterActive = args.includes('--active');
    const filterExpired = args.includes('--expired');
    const userEmail = args.find(arg => !arg.startsWith('--'));

    const query: mongoose.FilterQuery<ICouponDocument> = {};
    
    if (filterActive) {
      query.isActive = true;
      query.expirationDate = { $gt: new Date() };
    } else if (filterExpired) {
      query.$or = [
        { isActive: false },
        { expirationDate: { $lt: new Date() } },
      ];
    }

    if (userEmail) {
      const user = await User.findOne({ email: userEmail });
      if (user) {
        query.userId = user._id;
      } else {
        console.error(`User with email ${userEmail} not found`);
        process.exit(1);
      }
    }

    const coupons = await Coupon.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    if (coupons.length === 0) {
      console.log('\nNo coupons found matching the criteria.');
      process.exit(0);
    }

    console.log(`\nFound ${coupons.length} coupon(s):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Code            | Discount | User                    | Status   | Expires        ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const coupon of coupons) {
      const userDoc = coupon.userId as unknown as IUserDocument;
      const isExpired = coupon.expirationDate < new Date();
      const status = !coupon.isActive ? 'Used' : isExpired ? 'Expired' : 'Active';
      const statusColor = status === 'Active' ? '\x1b[32m' : status === 'Used' ? '\x1b[33m' : '\x1b[31m';
      const resetColor = '\x1b[0m';
      const userEmail = userDoc && typeof userDoc === 'object' && 'email' in userDoc ? userDoc.email : 'N/A';

      console.log(
        `${coupon.code.padEnd(15)} | ${(coupon.discountPercentage + '%').padEnd(8)} | ` +
        `${userEmail.padEnd(23)} | ${statusColor}${status.padEnd(8)}${resetColor} | ` +
        `${coupon.expirationDate.toLocaleDateString().padEnd(14)}`,
      );
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\nUsage tips:');
    console.log('  npm run list-coupons                    # List all coupons');
    console.log('  npm run list-coupons --active           # List only active and non-expired coupons');
    console.log('  npm run list-coupons --expired          # List only expired or used coupons');
    console.log('  npm run list-coupons user@example.com   # List coupons for a specific user');

  } catch (error) {
    console.error('Error listing coupons:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

void listCoupons();
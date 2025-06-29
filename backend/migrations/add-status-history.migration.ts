import mongoose from 'mongoose';
import { Order } from '../models/order.model.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateStatusHistory(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.error('Connected to MongoDB');

    const orders = await Order.find({ statusHistory: { $exists: false } });
    console.error(`Found ${orders.length} orders without status history`);

    let updatedCount = 0;
    for (const order of orders) {
      const initialStatus = order.status || 'completed';
      
      order.statusHistory = [
        {
          from: initialStatus,
          to: initialStatus,
          timestamp: order.createdAt,
          reason: 'Migration: Initial status',
        },
      ];

      await order.save({ validateBeforeSave: false });
      updatedCount++;
      
      if (updatedCount % 100 === 0) {
        console.error(`Updated ${updatedCount} orders...`);
      }
    }

    console.error(`Successfully migrated ${updatedCount} orders`);
    
    await mongoose.disconnect();
    console.error('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void migrateStatusHistory();
}

export { migrateStatusHistory };
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import { defaultLogger as logger } from '../utils/logger.js';

async function migratePaymentIntentIndex(): Promise<void> {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    logger.info('Starting payment intent index migration...');

    // Check if old index exists
    const indexes = await db.collection('orders').indexes();
    const oldIndexExists = indexes.some(idx => 
      idx.name === 'stripePaymentIntentId_1' || 
      idx.name === 'idx_stripe_payment_intent_unique',
    );
    const newIndexExists = indexes.some(idx => 
      idx.name === 'paymentIntentId_1' || 
      idx.name === 'idx_payment_intent_unique',
    );

    if (oldIndexExists) {
      logger.info('Dropping old stripePaymentIntentId index...');
      try {
        await db.collection('orders').dropIndex('stripePaymentIntentId_1');
        logger.info('✓ Old index stripePaymentIntentId_1 dropped');
      } catch {
        // Try alternate name
        try {
          await db.collection('orders').dropIndex('idx_stripe_payment_intent_unique');
          logger.info('✓ Old index idx_stripe_payment_intent_unique dropped');
        } catch {
          logger.warn('Could not drop old index, it may not exist');
        }
      }
    }

    // Create new index if it doesn't exist
    if (!newIndexExists) {
      logger.info('Creating new paymentIntentId index...');
      await db.collection('orders').createIndex(
        { paymentIntentId: 1 },
        {
          name: 'idx_payment_intent_unique',
          unique: true,
          sparse: true,
          background: true,
        },
      );
      logger.info('✓ New index created');
    } else {
      logger.info('✓ New index already exists');
    }

    // Verify the migration
    const newIndexes = await db.collection('orders').indexes();
    const verifyNewIndex = newIndexes.some(idx => 
      idx.name === 'paymentIntentId_1' || 
      idx.name === 'idx_payment_intent_unique',
    );

    if (verifyNewIndex) {
      logger.info('✅ Migration completed successfully');
      
      // Log all current indexes for verification
      logger.info('Current indexes on orders collection:');
      newIndexes.forEach(idx => {
        logger.info(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } else {
      throw new Error('Migration verification failed');
    }

  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
void migratePaymentIntentIndex();
import mongoose from 'mongoose';
import type { IndexSpecification } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function createInventoryIndexes() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Create indexes for Product collection
    console.log('Creating indexes for products collection...');

    const productIndexes: { key: IndexSpecification; name: string; background: boolean }[] = [
      // Compound index for atomic inventory operations with variants
      {
        key: { '_id': 1, 'variants.variantId': 1, 'variants.inventory': 1 },
        name: 'idx_product_variant_inventory',
        background: true,
      },
      // Index for inventory queries on variants
      {
        key: { 'variants.inventory': 1 },
        name: 'idx_variant_inventory',
        background: true,
      },
      // Index for variant lookup
      {
        key: { 'variants.variantId': 1 },
        name: 'idx_variant_id',
        background: true,
      },
      // Compound index for deleted products filter
      {
        key: { 'isDeleted': 1, '_id': 1 },
        name: 'idx_deleted_product',
        background: true,
      },
      // Index for low stock queries
      {
        key: { 'variants.inventory': 1, 'lowStockThreshold': 1 },
        name: 'idx_low_stock',
        background: true,
      },
    ];

    for (const index of productIndexes) {
      try {
        await db.collection('products').createIndex(index.key, {
          name: index.name,
          background: index.background,
        });
        console.log(`✓ Created index: ${index.name}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`- Index already exists: ${index.name}`);
        } else {
          console.error(`✗ Failed to create index ${index.name}:`, error);
        }
      }
    }

    // Create indexes for Order collection (already handled in model, but ensure unique constraints)
    console.log('\nCreating indexes for orders collection...');

    const orderIndexes: { key: IndexSpecification; name: string; unique: boolean; sparse: boolean; background: boolean }[] = [
      // Unique index for stripeSessionId
      {
        key: { 'stripeSessionId': 1 },
        name: 'idx_stripe_session_unique',
        unique: true,
        sparse: true,
        background: true,
      },
      // Unique index for stripePaymentIntentId
      {
        key: { 'stripePaymentIntentId': 1 },
        name: 'idx_stripe_payment_intent_unique',
        unique: true,
        sparse: true,
        background: true,
      },
    ];

    for (const index of orderIndexes) {
      try {
        await db.collection('orders').createIndex(index.key, {
          name: index.name,
          unique: index.unique,
          sparse: index.sparse,
          background: index.background,
        });
        console.log(`✓ Created index: ${index.name}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`- Index already exists: ${index.name}`);
        } else {
          console.error(`✗ Failed to create index ${index.name}:`, error);
        }
      }
    }

    // Create indexes for Inventory History collection
    console.log('\nCreating indexes for inventoryhistories collection...');

    const historyIndexes: { key: IndexSpecification; name: string; background: boolean }[] = [
      // Compound index for querying history by product and date
      {
        key: { 'productId': 1, 'createdAt': -1 },
        name: 'idx_product_history',
        background: true,
      },
      // Index for querying by variant
      {
        key: { 'variantId': 1, 'createdAt': -1 },
        name: 'idx_variant_history',
        background: true,
      },
    ];

    for (const index of historyIndexes) {
      try {
        await db.collection('inventoryhistories').createIndex(index.key, {
          name: index.name,
          background: index.background,
        });
        console.log(`✓ Created index: ${index.name}`);
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`- Index already exists: ${index.name}`);
        } else {
          console.error(`✗ Failed to create index ${index.name}:`, error);
        }
      }
    }

    console.log('\n✅ All indexes created successfully');
    
    // List all indexes for verification
    console.log('\nCurrent indexes:');
    const collections = ['products', 'orders', 'inventoryhistories'];
    for (const collection of collections) {
      console.log(`\n${collection}:`);
      const indexes = await db.collection(collection).indexes();
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
createInventoryIndexes();
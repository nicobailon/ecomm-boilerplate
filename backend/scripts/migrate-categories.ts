import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { Collection } from '../models/collection.model.js';
import { User } from '../models/user.model.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import dotenv from 'dotenv';

dotenv.config();

const categoryToCollectionMap: Record<string, string> = {
  'jeans': 'Denim Collection',
  't-shirts': 'Casual Wear',
  'shoes': 'Footwear',
  'glasses': 'Eyewear',
  'jackets': 'Outerwear',
  'suits': 'Formal Wear',
  'bags': 'Accessories',
};

async function migrateCategoriesToCollections(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }
    await mongoose.connect(mongoUri);
    console.warn('Connected to MongoDB');

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const adminUser = await User.findOne({ role: 'admin' }).session(session);
      if (!adminUser) {
        throw new Error('No admin user found. Please create an admin user first.');
      }

      console.warn(`Using admin user: ${adminUser.email}`);

      for (const [category, collectionName] of Object.entries(categoryToCollectionMap)) {
        console.warn(`\nProcessing category: ${category} -> ${collectionName}`);
        
        const slug = await generateUniqueSlug(
          collectionName,
          async (s) => !!(await Collection.findOne({ slug: s }).session(session)),
        );

        let collection = await Collection.findOne({ 
          slug, 
          owner: adminUser._id, 
        }).session(session);

        if (!collection) {
          const collections = await Collection.create([{
            name: collectionName,
            slug,
            description: `Products from the ${category} category`,
            owner: adminUser._id,
            products: [],
            isPublic: true,
          }], { session });
          
          collection = collections[0];
          console.warn(`Created collection: ${collectionName}`);
        } else {
          console.warn(`Collection already exists: ${collectionName}`);
        }

        const products = await Product.find({ 
          category,
          collectionId: { $exists: false },
        }).session(session);

        if (products.length > 0) {
          const productIds = products.map(p => p._id);
          
          await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { collectionId: collection._id } },
            { session },
          );

          await Collection.findByIdAndUpdate(
            collection._id,
            { $addToSet: { products: { $each: productIds } } },
            { session },
          );

          console.warn(`Migrated ${products.length} products to collection ${collectionName}`);
        } else {
          console.warn(`No products to migrate for category ${category}`);
        }
      }
      
      await session.commitTransaction();
      console.warn('\nMigration completed successfully!');
      
      const summary = await Collection.aggregate([
        {
          $match: { owner: adminUser._id },
        },
        {
          $project: {
            name: 1,
            productCount: { $size: '$products' },
          },
        },
      ]);
      
      interface CollectionSummary {
        name: string;
        productCount: number;
      }
      
      console.warn('\nMigration Summary:');
      summary.forEach((col: CollectionSummary) => {
        console.warn(`- ${col.name}: ${col.productCount} products`);
      });
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.warn('\nDisconnected from MongoDB');
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  void migrateCategoriesToCollections();
}
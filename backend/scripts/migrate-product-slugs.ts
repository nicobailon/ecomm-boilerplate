import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function migrateProductSlugs(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.error('Please ensure MONGODB_URI or MONGO_URI is set in your .env file');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.warn('Connected to MongoDB');

    // Find all products without slugs
    const productsWithoutSlugs = await Product.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
      ],
    });

    console.warn(`Found ${productsWithoutSlugs.length} products without slugs`);

    // Update each product with a unique slug
    for (const product of productsWithoutSlugs) {
      const slug = await generateUniqueSlug(
        product.name,
        async (s) => !!(await Product.findOne({ slug: s, _id: { $ne: product._id } })),
      );
      
      product.slug = slug;
      await product.save();
      console.warn(`Updated product "${product.name}" with slug: ${slug}`);
    }

    console.warn('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.warn('Disconnected from MongoDB');
  }
}

void migrateProductSlugs();
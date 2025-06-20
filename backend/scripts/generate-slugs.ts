import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { connectDB } from '../lib/db.js';

dotenv.config();

interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

const generateProductSlugs = async (options: MigrationOptions = {}) => {
  const { dryRun = false, verbose = false } = options;

  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const productsWithoutSlug = await Product.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`Found ${productsWithoutSlug.length} products without slugs`);

    if (productsWithoutSlug.length === 0) {
      console.log('No products need slug generation');
      return;
    }

    let updatedCount = 0;
    const errors: Array<{ productId: string; name: string; error: string }> = [];

    for (const product of productsWithoutSlug) {
      try {
        const slug = await generateUniqueSlug(
          product.name,
          async (slug) => {
            const existing = await Product.findOne({ slug, _id: { $ne: product._id } });
            return !!existing;
          }
        );

        if (verbose) {
          console.log(`Product: "${product.name}" -> Slug: "${slug}"`);
        }

        if (!dryRun) {
          product.slug = slug;
          await product.save();
          updatedCount++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          productId: (product._id as mongoose.Types.ObjectId).toString(),
          name: product.name,
          error: errorMessage
        });
        console.error(`Error processing product ${product.name}:`, errorMessage);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total products processed: ${productsWithoutSlug.length}`);
    if (!dryRun) {
      console.log(`Successfully updated: ${updatedCount}`);
      console.log(`Errors: ${errors.length}`);
    } else {
      console.log('DRY RUN - No changes were made');
    }

    if (errors.length > 0 && verbose) {
      console.log('\n=== Errors ===');
      errors.forEach(({ productId, name, error }) => {
        console.log(`- Product ID: ${productId}, Name: ${name}, Error: ${error}`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

const printUsage = () => {
  console.log(`
Usage: npm run generate-slugs [options]

Options:
  --dry-run    Run without making changes (preview mode)
  --verbose    Show detailed output for each product

Examples:
  npm run generate-slugs
  npm run generate-slugs --dry-run
  npm run generate-slugs --verbose
  npm run generate-slugs --dry-run --verbose
  `);
};

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose')
  };

  console.log('Starting slug generation migration...');
  if (options.dryRun) {
    console.log('Running in DRY RUN mode - no changes will be made');
  }

  await generateProductSlugs(options);
};

if (require.main === module) {
  main();
}

export default generateProductSlugs;
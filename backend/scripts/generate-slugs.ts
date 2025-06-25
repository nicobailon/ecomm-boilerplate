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

const generateProductSlugs = async (options: MigrationOptions = {}): Promise<void> => {
  const { dryRun = false, verbose = false } = options;

  try {
    await connectDB();
    console.warn('Connected to MongoDB');

    const productsWithoutSlug = await Product.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' },
      ],
    });

    console.warn(`Found ${productsWithoutSlug.length} products without slugs`);

    if (productsWithoutSlug.length === 0) {
      console.warn('No products need slug generation');
      return;
    }

    let updatedCount = 0;
    const errors: { productId: string; name: string; error: string }[] = [];

    for (const product of productsWithoutSlug) {
      try {
        const slug = await generateUniqueSlug(
          product.name,
          async (slug) => {
            const existing = await Product.findOne({ slug, _id: { $ne: product._id } });
            return !!existing;
          },
        );

        if (verbose) {
          console.warn(`Product: "${product.name}" -> Slug: "${slug}"`);
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
          error: errorMessage,
        });
        console.error(`Error processing product ${product.name}:`, errorMessage);
      }
    }

    console.warn('\n=== Migration Summary ===');
    console.warn(`Total products processed: ${productsWithoutSlug.length}`);
    if (!dryRun) {
      console.warn(`Successfully updated: ${updatedCount}`);
      console.warn(`Errors: ${errors.length}`);
    } else {
      console.warn('DRY RUN - No changes were made');
    }

    if (errors.length > 0 && verbose) {
      console.warn('\n=== Errors ===');
      errors.forEach(({ productId, name, error }) => {
        console.warn(`- Product ID: ${productId}, Name: ${name}, Error: ${error}`);
      });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.warn('Database connection closed');
  }
};

const printUsage = (): void => {
  console.warn(`
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

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') ?? args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
  };

  console.warn('Starting slug generation migration...');
  if (options.dryRun) {
    console.warn('Running in DRY RUN mode - no changes will be made');
  }

  await generateProductSlugs(options);
};

if (require.main === module) {
  void main();
}

export default generateProductSlugs;
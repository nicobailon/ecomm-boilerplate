import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { createThrottledLogger } from '../utils/throttledLogger.js';

interface LegacyVariant {
  variantId: string;
  label?: string;
  size?: string;
  color?: string;
  price: number;
  inventory: number;
  reservedInventory: number;
  images: string[];
  sku?: string;
}

// Load environment variables from project root
dotenv.config({ path: path.join(process.cwd(), '.env') });

interface MigrationOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

interface MigrationResult {
  processed: number;
  updated: number;
  defaultVariantsCreated: number;
  errors: { productId: string; error: string }[];
}

function generateVariantLabel(size?: string, color?: string): string {
  if (size && color) {
    return `${size} - ${color}`;
  }
  if (size) {
    return size;
  }
  if (color) {
    return color;
  }
  return 'Default';
}

async function migrateVariantLabels(options: MigrationOptions = {}): Promise<MigrationResult> {
  const { dryRun = false, verbose = false } = options;
  const result: MigrationResult = {
    processed: 0,
    updated: 0,
    defaultVariantsCreated: 0,
    errors: [],
  };

  // Use throttled logger for production runs with large datasets
  const logger = createThrottledLogger(
    { operation: 'variant-migration' },
    {
      maxLogsPerMinute: 100,
      summaryInterval: 30000, // 30 seconds
    }
  );

  try {
    const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.error('Please ensure MONGODB_URI or MONGO_URI is set in your .env file');
      process.exit(1);
    }
    
    // Disable mongoose debug logs unless verbose mode
    mongoose.set('debug', verbose);
    
    await mongoose.connect(mongoUri);
    logger.info('✅ Connected to MongoDB');

    if (dryRun) {
      logger.info('🔍 DRY RUN MODE - No changes will be made');
    }

    const products = await Product.find({});
    logger.info(`📦 Found ${products.length} products to process`);

    // Collect all existing variant IDs to avoid global collisions
    const allExistingVariantIds = new Set<string>();
    for (const p of products) {
      if (p.variants && Array.isArray(p.variants)) {
        for (const v of p.variants) {
          if (v.variantId) {
            allExistingVariantIds.add(v.variantId);
          }
        }
      }
    }

    for (const product of products) {
      result.processed++;
      
      try {
        let needsUpdate = false;

        if (!product.variants || product.variants.length === 0) {
          if (verbose) {
            logger.info(`📝 Product "${product.name}" has no variants, creating default variant`);
          }
          
          // Generate a unique variant ID to avoid collisions
          let variantId = 'default';
          let suffix = 1;
          
          // Check against all existing variant IDs globally
          while (allExistingVariantIds.has(variantId)) {
            variantId = `default-${suffix}`;
            suffix++;
          }
          
          // Add to the set to prevent duplicates in this run
          allExistingVariantIds.add(variantId)
          
          if (!dryRun) {
            product.variants = [{
              variantId,
              label: 'Default',
              price: product.price,
              inventory: 0,
              reservedInventory: 0,
              images: [],
            }];
            needsUpdate = true;
          }
          result.defaultVariantsCreated++;
          if (dryRun) {
            needsUpdate = true;
          }
        } else {
          for (const variant of product.variants as LegacyVariant[]) {
            if (!variant.label) {
              const label = generateVariantLabel(variant.size, variant.color);
              
              if (verbose) {
                logger.info(`🏷️  Updating variant ${variant.variantId} of "${product.name}" with label: "${label}"`);
              }
              
              if (!dryRun) {
                variant.label = label;
              }
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate && !dryRun) {
          await product.save();
          result.updated++;
          
          if (verbose) {
            console.warn(`✅ Updated product "${product.name}"`);
          }
        } else if (needsUpdate && dryRun) {
          result.updated++;
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          productId: String(product._id),
          error: errorMessage,
        });
        
        console.error(`❌ Error processing product "${product.name}": ${errorMessage}`);
      }
    }

    console.warn('\n📊 Migration Summary:');
    console.warn(`   Products processed: ${result.processed}`);
    console.warn(`   Products updated: ${result.updated}`);
    console.warn(`   Default variants created: ${result.defaultVariantsCreated}`);
    console.warn(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.warn('\n❌ Errors encountered:');
      result.errors.forEach(({ productId, error }) => {
        console.warn(`   Product ${productId}: ${error}`);
      });
    }

    if (dryRun) {
      console.warn('\n🔍 DRY RUN COMPLETED - No actual changes were made');
      console.warn('   Run without --dry-run to apply changes');
    } else {
      console.warn('\n✅ Migration completed successfully');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.warn('🔌 Disconnected from MongoDB');
  }

  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📝 Product Variant Label Migration Script

This script migrates product variants to use the new label-based system.

Usage:
  npm run migrate:variant-labels [options]

Options:
  --dry-run    Preview changes without applying them
  --verbose    Show detailed output for each operation
  --help       Show this help message

Examples:
  npm run migrate:variant-labels --dry-run     # Preview changes
  npm run migrate:variant-labels --verbose     # Apply with detailed logs
  npm run migrate:variant-labels               # Apply changes
`);
    process.exit(0);
  }

  try {
    await migrateVariantLabels({ dryRun, verbose });
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { migrateVariantLabels, type MigrationOptions, type MigrationResult };
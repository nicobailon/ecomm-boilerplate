import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import dotenv from 'dotenv';
import path from 'path';

interface VariantWithLabel {
  variantId: string;
  label: string;
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

interface RevertOptions {
  dryRun?: boolean;
  verbose?: boolean;
}

interface RevertResult {
  processed: number;
  reverted: number;
  defaultVariantsRemoved: number;
  errors: { productId: string; error: string }[];
}

async function revertVariantLabels(options: RevertOptions = {}): Promise<RevertResult> {
  const { dryRun = false, verbose = false } = options;
  const result: RevertResult = {
    processed: 0,
    reverted: 0,
    defaultVariantsRemoved: 0,
    errors: [],
  };

  // Use throttled logger for production runs with large datasets
  // const _logger = createThrottledLogger(
  //   { operation: 'variant-revert' },
  //   {
  //     maxLogsPerMinute: 100,
  //     summaryInterval: 30000, // 30 seconds
  //   },
  // );

  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in environment variables');
      console.error('Please ensure MONGO_URI is set in your .env file');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.warn('✅ Connected to MongoDB');

    if (dryRun) {
      console.warn('🔍 DRY RUN MODE - No changes will be made');
    }

    const products = await Product.find({});
    console.warn(`📦 Found ${products.length} products to process`);

    for (const product of products) {
      result.processed++;
      
      try {
        let needsUpdate = false;

        if (product.variants && product.variants.length === 1) {
          const variant = product.variants[0] as VariantWithLabel;
          
          if (variant.variantId === 'default' && variant.label === 'Default') {
            if (verbose) {
              console.warn(`📝 Product "${product.name}" has default variant, removing it`);
            }
            
            if (!dryRun) {
              product.variants = [];
              needsUpdate = true;
            }
            result.defaultVariantsRemoved++;
            if (dryRun) {
              needsUpdate = true;
            }
          }
        }

        for (const variant of product.variants as VariantWithLabel[]) {
          if (variant.label) {
            if (verbose) {
              console.warn(`🏷️  Removing label from variant ${variant.variantId} of "${product.name}"`);
            }
            
            if (!dryRun) {
              // Create a new variant without the label property
              const { label: _label, ...variantWithoutLabel } = variant;
              // Replace the variant in the array
              const variantIndex = product.variants.findIndex(v => v.variantId === variant.variantId);
              if (variantIndex !== -1) {
                product.variants[variantIndex] = variantWithoutLabel as typeof variant;
                product.markModified('variants');
              }
            }
            needsUpdate = true;
          }
        }

        if (needsUpdate && !dryRun) {
          await product.save();
          result.reverted++;
          
          if (verbose) {
            console.warn(`✅ Reverted product "${product.name}"`);
          }
        } else if (needsUpdate && dryRun) {
          result.reverted++;
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

    console.warn('\n📊 Revert Summary:');
    console.warn(`   Products processed: ${result.processed}`);
    console.warn(`   Products reverted: ${result.reverted}`);
    console.warn(`   Default variants removed: ${result.defaultVariantsRemoved}`);
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
      console.warn('\n✅ Revert completed successfully');
    }

  } catch (error) {
    console.error('❌ Revert failed:', error);
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
  const verbose = args.includes('--verbose') ?? args.includes('-v');

  if (args.includes('--help') ?? args.includes('-h')) {
    console.warn(`
📝 Product Variant Label Revert Script

This script reverts the product variant label migration.

Usage:
  npm run revert:variant-labels [options]

Options:
  --dry-run    Preview changes without applying them
  --verbose    Show detailed output for each operation
  --help       Show this help message

Examples:
  npm run revert:variant-labels --dry-run     # Preview changes
  npm run revert:variant-labels --verbose     # Apply with detailed logs
  npm run revert:variant-labels               # Apply changes
`);
    process.exit(0);
  }

  try {
    await revertVariantLabels({ dryRun, verbose });
    process.exit(0);
  } catch (error) {
    console.error('❌ Revert script failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { revertVariantLabels, type RevertOptions, type RevertResult };
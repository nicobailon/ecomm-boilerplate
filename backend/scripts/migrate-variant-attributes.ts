#!/usr/bin/env node
import mongoose from 'mongoose';
import '../utils/validateEnv.js';
import { Product } from '../models/product.model.js';
import type { IProductDocument } from '../models/product.model.js';
import { generateVariantLabel } from '../utils/variantLabel.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 250;

async function migrateVariantAttributes(): Promise<void> {
  console.error('🚀 Starting variant attributes migration...');
  if (DRY_RUN) {
    console.error('🔸 Running in DRY RUN mode - no changes will be saved');
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not configured');
    }
    await mongoose.connect(mongoUri);
    console.error('✅ Connected to MongoDB');

    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
    console.error(`📊 Found ${totalProducts} products to process`);

    let processedCount = 0;
    let modifiedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let skip = 0; skip < totalProducts; skip += BATCH_SIZE) {
      const products = await Product.find({ isDeleted: { $ne: true } })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean() as IProductDocument[];

      interface BulkOp {
        updateOne: {
          filter: { _id: mongoose.Types.ObjectId };
          update: { $set: Record<string, unknown> };
        };
      }
      const bulkOps: BulkOp[] = [];

      for (const product of products) {
        try {
          let hasChanges = false;
          const updates: Record<string, unknown> = {};

          // Build variantTypes from existing variants
          const variantTypes = new Set<string>();
          
          // Process variants to extract types and migrate attributes
          if (product.variants && product.variants.length > 0) {
            const updatedVariants = product.variants.map(variant => {
              const variantUpdate = { 
                ...variant, 
                attributes: variant.attributes ?? {},
              };
              
              // Check if attributes was initialized
              if (!variant.attributes) {
                hasChanges = true;
              }

              // Copy legacy fields to attributes
              if (variant.size) {
                variantUpdate.attributes.size = variant.size;
                variantTypes.add('size');
              }
              
              if (variant.color) {
                variantUpdate.attributes.color = variant.color;
                variantTypes.add('color');
              }

              // Parse label for additional attributes if attributes are empty
              const attributeKeys = Object.keys(variantUpdate.attributes as Record<string, unknown>);
              if (attributeKeys.length === 0 && variant.label) {
                const parts = variant.label.split(' / ');
                // TODO: Log labels that don't match expected heuristic for manual audit
                if (parts.length > 0 && parts[0]) {
                  variantUpdate.attributes.size = parts[0];
                  variantTypes.add('size');
                }
                if (parts.length > 1 && parts[1]) {
                  variantUpdate.attributes.color = parts[1];
                  variantTypes.add('color');
                }
                if (parts.length > 2 && parts[2]) {
                  variantUpdate.attributes.material = parts[2];
                  variantTypes.add('material');
                }
              }

              // Update label based on attributes
              const newLabel = generateVariantLabel(variantUpdate.attributes);
              if (newLabel !== variant.label) {
                variantUpdate.label = newLabel;
                hasChanges = true;
              }

              return variantUpdate;
            });

            if (hasChanges) {
              updates.variants = updatedVariants;
            }
          }

          // Set variantTypes if we found any
          if (variantTypes.size > 0 && !product.variantTypes) {
            updates.variantTypes = Array.from(variantTypes);
            hasChanges = true;
          }

          if (hasChanges) {
            if (!DRY_RUN) {
              bulkOps.push({
                updateOne: {
                  filter: { _id: product._id as mongoose.Types.ObjectId },
                  update: { $set: updates },
                },
              });
            }
            modifiedCount++;
            console.error(`  ✏️  Modified: ${product.name} (${String(product._id)})`);
          }

          processedCount++;
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error processing product ${String(product._id)}:`, error);
        }
      }

      // Execute bulk updates
      if (bulkOps.length > 0 && !DRY_RUN) {
        await Product.bulkWrite(bulkOps);
        console.error(`  💾 Saved batch of ${bulkOps.length} updates`);
      }

      console.error(`Progress: ${processedCount}/${totalProducts} (${Math.round(processedCount / totalProducts * 100)}%)`);
    }

    console.error('\n📈 Migration Summary:');
    console.error(`  • Total products: ${totalProducts}`);
    console.error(`  • Processed: ${processedCount}`);
    console.error(`  • Modified: ${modifiedCount}`);
    console.error(`  • Errors: ${errorCount}`);

    if (DRY_RUN) {
      console.error('\n🔸 DRY RUN completed - no changes were saved');
      console.error('Run without --dry-run flag to apply changes');
    } else {
      console.error('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.error('🔌 Disconnected from MongoDB');
  }
}

// Run migration
void migrateVariantAttributes().catch(console.error);
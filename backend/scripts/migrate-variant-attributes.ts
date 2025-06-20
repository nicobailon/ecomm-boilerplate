#!/usr/bin/env node
import mongoose from 'mongoose';
import '../utils/validateEnv.js';
import { Product } from '../models/product.model.js';
import { IProductDocument } from '../models/product.model.js';
import { generateVariantLabel } from '../utils/variantLabel.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 250;

async function migrateVariantAttributes() {
  console.log('🚀 Starting variant attributes migration...');
  if (DRY_RUN) {
    console.log('🔸 Running in DRY RUN mode - no changes will be saved');
  }

  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ Connected to MongoDB');

    const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
    console.log(`📊 Found ${totalProducts} products to process`);

    let processedCount = 0;
    let modifiedCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let skip = 0; skip < totalProducts; skip += BATCH_SIZE) {
      const products = await Product.find({ isDeleted: { $ne: true } })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean() as IProductDocument[];

      const bulkOps: any[] = [];

      for (const product of products) {
        try {
          let hasChanges = false;
          const updates: any = {};

          // Build variantTypes from existing variants
          const variantTypes = new Set<string>();
          
          // Process variants to extract types and migrate attributes
          if (product.variants && product.variants.length > 0) {
            const updatedVariants = product.variants.map(variant => {
              const variantUpdate: any = { ...variant };
              
              // Initialize attributes if not present
              if (!variantUpdate.attributes) {
                variantUpdate.attributes = {};
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
              if (Object.keys(variantUpdate.attributes).length === 0 && variant.label) {
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
                  filter: { _id: product._id },
                  update: { $set: updates },
                },
              });
            }
            modifiedCount++;
            console.log(`  ✏️  Modified: ${product.name} (${product._id})`);
          }

          processedCount++;
        } catch (error) {
          errorCount++;
          console.error(`  ❌ Error processing product ${product._id}:`, error);
        }
      }

      // Execute bulk updates
      if (bulkOps.length > 0 && !DRY_RUN) {
        await Product.bulkWrite(bulkOps);
        console.log(`  💾 Saved batch of ${bulkOps.length} updates`);
      }

      console.log(`Progress: ${processedCount}/${totalProducts} (${Math.round(processedCount / totalProducts * 100)}%)`);
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  • Total products: ${totalProducts}`);
    console.log(`  • Processed: ${processedCount}`);
    console.log(`  • Modified: ${modifiedCount}`);
    console.log(`  • Errors: ${errorCount}`);

    if (DRY_RUN) {
      console.log('\n🔸 DRY RUN completed - no changes were saved');
      console.log('Run without --dry-run flag to apply changes');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateVariantAttributes().catch(console.error);
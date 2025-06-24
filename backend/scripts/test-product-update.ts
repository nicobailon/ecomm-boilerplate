import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model.js';
import { productService } from '../services/product.service.js';
import { IProductWithVariants } from '../types/product.types.js';

dotenv.config();

async function testProductUpdate(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }
    await mongoose.connect(mongoUri);
    console.error('Connected to MongoDB');

    // Find a product with variants
    const productDoc = await Product.findOne({ 'variants.0': { $exists: true } });
    
    if (!productDoc) {
      console.error('No product with variants found');
      return;
    }

    console.error('Found product:', productDoc.name);
    console.error('Current variants:', JSON.stringify(productDoc.variants, null, 2));

    // Get the product through the service to ensure proper typing
    const product = await productService.getProductById(String(productDoc._id));

    // Try to update with the same variants but different inventory
    const updatedVariants = product.variants.map(v => ({
      variantId: v.variantId,
      label: v.label,
      size: v.size,
      color: v.color,
      price: v.price,
      inventory: v.inventory + 10, // Add 10 to each variant's inventory
      images: v.images,
      sku: v.sku,
      attributes: v.attributes,
    }));

    console.error('Updating with variants:', JSON.stringify(updatedVariants, null, 2));

    const updated = await productService.updateProduct(String(productDoc._id), {
      variants: updatedVariants,
    }) as IProductWithVariants;

    console.error('Updated product variants:', JSON.stringify(updated.variants, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

void testProductUpdate();
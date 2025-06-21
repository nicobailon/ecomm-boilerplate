import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model.js';
import { productService } from '../services/product.service.js';

dotenv.config();

async function testProductUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Find a product with variants
    const product = await Product.findOne({ 'variants.0': { $exists: true } });
    
    if (!product) {
      console.log('No product with variants found');
      return;
    }

    console.log('Found product:', product.name);
    console.log('Current variants:', JSON.stringify(product.variants, null, 2));

    // Try to update with the same variants but different inventory
    const updatedVariants = product.variants.map(v => ({
      ...v.toObject(),
      inventory: v.inventory + 10, // Add 10 to each variant's inventory
    }));

    console.log('Updating with variants:', JSON.stringify(updatedVariants, null, 2));

    const updated = await productService.updateProduct(product._id.toString(), {
      variants: updatedVariants,
    });

    console.log('Updated product variants:', JSON.stringify(updated.variants, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testProductUpdate();
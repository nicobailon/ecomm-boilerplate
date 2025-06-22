import { nanoid } from 'nanoid';
import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { connectDB } from '../lib/db.js';
import { IMediaItem } from '../types/media.types.js';

async function migrateProductMedia() {
  await connectDB();
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const products = await Product.find({ 
      isDeleted: { $ne: true },
      mediaGallery: { $exists: false }
    }).session(session);
    
    console.log(`Found ${products.length} products to migrate`);
    
    for (const product of products) {
      const mediaItems: IMediaItem[] = [];
      
      if (product.image) {
        mediaItems.push({
          id: nanoid(6),
          type: 'image',
          url: product.image,
          title: `${product.name} - Main Image`,
          order: 0,
          createdAt: new Date(),
          metadata: {}
        });
      }
      
      const variantImages = new Set<string>();
      product.variants?.forEach(variant => {
        variant.images?.forEach(img => {
          if (img && img !== product.image) {
            variantImages.add(img);
          }
        });
      });
      
      let order = 1;
      const variantImageArray = Array.from(variantImages);
      for (let i = 0; i < variantImageArray.length && order < 6; i++) {
        const variantImage = variantImageArray[i];
        
        mediaItems.push({
          id: nanoid(6),
          type: 'image',
          url: variantImage,
          title: `${product.name} - Variant Image ${order}`,
          order: order++,
          createdAt: new Date(),
          metadata: {}
        });
      }
      
      product.mediaGallery = mediaItems;
      await product.save({ session, validateBeforeSave: false });
    }
    
    await session.commitTransaction();
    console.log('Migration completed successfully');
  } catch (error) {
    await session.abortTransaction();
    console.error('Migration failed:', error);
    throw error;
  } finally {
    session.endSession();
    await mongoose.disconnect();
  }
}

// Auto-run the migration
migrateProductMedia().catch(console.error);
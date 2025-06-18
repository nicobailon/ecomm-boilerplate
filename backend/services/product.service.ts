import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IProduct } from '../types/index.js';
import { redis } from '../lib/redis.js';
import { UTApi } from 'uploadthing/server';
import { Collection, ICollection } from '../models/collection.model.js';
import { generateUniqueSlug } from '../utils/slugify.js';

class ProductService {
  private utapi = new UTApi();

  async getAllProducts(page: number = 1, limit: number = 12, search?: string) {
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    
    const query: any = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    let productsQuery = Product.find(query);
    
    if (search) {
      productsQuery = productsQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }
    
    const [products, total] = await Promise.all([
      productsQuery.skip(skip).limit(limitNum).populate('collectionId', 'name slug').lean(),
      Product.countDocuments(query)
    ]);
    
    return {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
    const { name, description, price, image, collectionId } = productData;
    
    if (!image) {
      throw new AppError('Product image URL is required', 400);
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Validate collection exists if provided
      if (collectionId) {
        const collectionExists = await Collection.findById(collectionId).session(session);
        if (!collectionExists) {
          throw new AppError('Invalid collection ID', 400);
        }
      }
      
      const product = await Product.create([{
        name,
        description,
        price,
        image,
        collectionId,
      }], { session });
      
      // If collection is provided, add product to collection's products array
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: product[0]._id } },
          { session }
        );
      }
      
      await session.commitTransaction();
      
      // Return the product (array from create with session)
      return product[0].toJSON() as unknown as IProduct;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateProduct(productId: string, updateData: Partial<IProduct>): Promise<IProduct> {
    const { name, description, price, image, collectionId } = updateData;
    
    // Get the current product to check for collection changes
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      throw new AppError('Product not found', 404);
    }
    
    // Validate new collection exists if provided
    if (collectionId !== undefined && collectionId !== null) {
      const collectionExists = await Collection.findById(collectionId);
      if (!collectionExists) {
        throw new AppError('Invalid collection ID', 400);
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { name, description, price, image, collectionId },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Handle collection changes
    if (currentProduct.collectionId?.toString() !== collectionId) {
      // Remove from old collection if exists
      if (currentProduct.collectionId) {
        await Collection.findByIdAndUpdate(
          currentProduct.collectionId,
          { $pull: { products: productId } }
        );
      }
      
      // Add to new collection if specified
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: productId } }
        );
      }
    }

    return product.toJSON() as unknown as IProduct;
  }

  async deleteProduct(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    // Delete image from UploadThing if exists
    if (product.image) {
      const fileKey = product.image.substring(product.image.lastIndexOf("/") + 1);
      try {
        await this.utapi.deleteFiles([fileKey]);
        console.log("Deleted image from UploadThing");
      } catch (error) {
        console.error("Error deleting image from UploadThing", error);
        // Do not block product deletion if image deletion fails
      }
    }
    
    // Remove product from all collections
    await Collection.updateMany(
      { products: productId },
      { $pull: { products: productId } }
    );
    
    await Product.findByIdAndDelete(productId);
  }

  async getFeaturedProducts(): Promise<IProduct[]> {
    // Try to get from cache first
    const cached = await redis.get("featured_products");
    if (cached) {
      return JSON.parse(cached);
    }

    // If not in cache, get from database
    const featuredProducts = await Product.find({ isFeatured: true }).lean();

    // Return empty array if no featured products, don't throw error
    if (!featuredProducts || featuredProducts.length === 0) {
      return [];
    }

    // Cache for 1 hour
    await redis.set("featured_products", JSON.stringify(featuredProducts), 'EX', 3600);

    return featuredProducts as unknown as IProduct[];
  }

  async getRecommendedProducts(): Promise<IProduct[]> {
    const products = await Product.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
        },
      },
    ]);

    return products;
  }

  async getProductById(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product.toJSON() as unknown as IProduct;
  }

  async toggleFeaturedProduct(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    product.isFeatured = !product.isFeatured;
    const updatedProduct = await product.save();
    
    // Update cache
    await this.updateFeaturedProductsCache();
    
    return updatedProduct.toJSON() as unknown as IProduct;
  }

  private async updateFeaturedProductsCache(): Promise<void> {
    try {
      const featuredProducts = await Product.find({ isFeatured: true }).lean();
      await redis.set("featured_products", JSON.stringify(featuredProducts), 'EX', 3600);
    } catch (error) {
      console.log("error in update cache function", error);
    }
  }

  async createProductWithCollection(
    userId: string,
    data: Partial<IProduct> & {
      collectionId?: string;
      collectionName?: string;
    }
  ): Promise<{
    product: IProduct;
    collection?: ICollection;
    created: {
      product: boolean;
      collection: boolean;
    };
  }> {
    if (data.collectionId && data.collectionName) {
      throw new AppError(
        'Provide either collectionId or collectionName, not both',
        400
      );
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      let collectionId = data.collectionId;
      let newCollection: ICollection | undefined;
      
      if (data.collectionName) {
        const collections = await Collection.create(
          [{
            name: data.collectionName.trim(),
            slug: await generateUniqueSlug(
              data.collectionName,
              async (s) => !!(await Collection.findOne({ slug: s }))
            ),
            description: '',
            owner: userId,
            products: [],
            isPublic: false,
          }],
          { session }
        );
        newCollection = collections[0] as ICollection;
        collectionId = (newCollection._id as mongoose.Types.ObjectId).toString();
      }
      
      if (collectionId) {
        const collection = await Collection.findOne({
          _id: collectionId,
          owner: userId,
        }).session(session);
        
        if (!collection && !newCollection) {
          throw new AppError('Collection not found or access denied', 404);
        }
      }
      
      const { collectionName: _cn, ...productData } = data;
      
      const product = await Product.create(
        [{
          ...productData,
          collectionId,
        }],
        { session }
      );
      
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: product[0]._id } },
          { session }
        );
      }
      
      await session.commitTransaction();
      
      return {
        product: product[0].toJSON() as unknown as IProduct,
        collection: newCollection,
        created: {
          product: true,
          collection: !!newCollection,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

export const productService = new ProductService();

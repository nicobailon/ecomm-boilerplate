import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IProduct } from '../types/index.js';
import { redis } from '../lib/redis.js';
import { UTApi } from 'uploadthing/server';

class ProductService {
  private utapi = new UTApi();

  async getAllProducts(page: number = 1, limit: number = 12, category?: string) {
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    
    const query = category ? { category } : {};
    const skip = (pageNum - 1) * limitNum;
    
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limitNum).lean(),
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
    const { name, description, price, image, category } = productData;
    
    if (!image) {
      throw new AppError('Product image URL is required', 400);
    }
    
    const product = await Product.create({
      name,
      description,
      price,
      image,
      category,
    });
    
    return product.toJSON() as unknown as IProduct;
  }

  async updateProduct(productId: string, updateData: Partial<IProduct>): Promise<IProduct> {
    const { name, description, price, image, category } = updateData;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { name, description, price, image, category },
      { new: true, runValidators: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404);
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

    if (!featuredProducts || featuredProducts.length === 0) {
      throw new AppError("No featured products found", 404);
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

  async getProductsByCategory(category: string): Promise<IProduct[]> {
    const products = await Product.find({ category }).lean();
    return products as unknown as IProduct[];
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
}

export const productService = new ProductService();

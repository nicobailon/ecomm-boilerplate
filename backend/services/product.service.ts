import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IProduct } from '../types/index.js';

export class ProductService {
  async getAllProducts(page: number = 1, limit: number = 12, category?: string) {
    const query = category ? { category } : {};
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query).skip(skip).limit(limit).lean(),
      Product.countDocuments(query)
    ]);
    
    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

  async deleteProduct(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    await Product.findByIdAndDelete(productId);
  }

  async getFeaturedProducts(): Promise<IProduct[]> {
    return Product.find({ isFeatured: true }).lean() as unknown as Promise<IProduct[]>;
  }
}

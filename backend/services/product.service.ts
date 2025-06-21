import mongoose from 'mongoose';
import { Product, IProductDocument } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IProduct, IProductWithVariants, IProductVariant } from '../types/index.js';
import { redis } from '../lib/redis.js';
import { UTApi } from 'uploadthing/server';
import { Collection, ICollection } from '../models/collection.model.js';
import { generateUniqueSlug, generateSlug } from '../utils/slugify.js';
import { CreateProductInput, UpdateProductInput, validateUniqueVariants, validateVariantInventory } from '../validations/product.validation.js';
import { toProduct, toProductWithVariants, toProductArray, toProductWithVariantsArray } from '../utils/type-converters.js';
import { CACHE_TTL, CACHE_KEYS } from '../constants/cache-config.js';
import { PAGINATION, PRODUCT_LIMITS, RETRY_CONFIG, REDIS_SCAN_CONFIG } from '../constants/app-limits.js';
import { getVariantOrDefault } from './helpers/variant.helper.js';
import { USE_VARIANT_LABEL } from '../utils/featureFlags.js';

class ProductService {
  private utapi = new UTApi();

  async getAllProducts(
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_LIMIT, 
    search?: string,
    includeVariants = false,
  ): Promise<{ products: (IProduct | IProductWithVariants)[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(PAGINATION.DEFAULT_PAGE, page);
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(PAGINATION.MIN_LIMIT, limit));
    
    const query: mongoose.FilterQuery<IProductDocument> = {};
    
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
      Product.countDocuments(query),
    ]);
    
    return {
      products: includeVariants ? toProductWithVariantsArray(products) : toProductArray(products),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async createProduct(productData: CreateProductInput): Promise<IProduct> {
    const { name, description, price, image, collectionId, variants = [], relatedProducts = [] } = productData;
    
    if (!image) {
      throw new AppError('Product image URL is required. Please upload an image for the product', 400);
    }
    
    if (variants.length > 0) {
      validateUniqueVariants(variants);
      validateVariantInventory(variants);
      
      // Validate SKU uniqueness for all variants
      for (const variant of variants) {
        if (variant.sku) {
          const isUnique = await this.validateSKUUniqueness(variant.sku);
          if (!isUnique) {
            throw new AppError(`SKU '${variant.sku}' already exists. Each variant must have a unique SKU`, 400);
          }
        }
      }
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Validate collection exists if provided
      if (collectionId) {
        const collectionExists = await Collection.findById(collectionId).session(session);
        if (!collectionExists) {
          throw new AppError(`Invalid collection ID: ${collectionId}. Collection not found`, 400);
        }
      }
      
      // Generate slug
      const slug = await generateUniqueSlug(
        name,
        async (s) => !!(await Product.findOne({ slug: s })),
      );
      
      const product = await Product.create([{
        name,
        description,
        price,
        image,
        collectionId,
        slug,
        variants,
        relatedProducts,
      }], { session });
      
      // If collection is provided, add product to collection's products array
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: product[0]._id } },
          { session },
        );
      }
      
      await session.commitTransaction();
      
      // Clear cache
      await this.clearProductCache(product[0].slug, (product[0]._id as mongoose.Types.ObjectId).toString());
      
      // Return the product (array from create with session)
      return toProduct(product[0]);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateProduct(productId: string, updateData: UpdateProductInput): Promise<IProduct> {
    const { name, description, price, image, collectionId, variants, relatedProducts } = updateData;
    
    // Get the current product to check for collection changes
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      throw new AppError(`Product not found with ID: ${productId}`, 404);
    }
    
    // Validate new collection exists if provided
    if (collectionId !== undefined && collectionId !== null) {
      const collectionExists = await Collection.findById(collectionId);
      if (!collectionExists) {
        throw new AppError(`Invalid collection ID: ${collectionId}. Collection not found`, 400);
      }
    }
    
    // Validate variants if provided
    if (variants && variants.length > 0) {
      validateUniqueVariants(variants);
      validateVariantInventory(variants);
      
      // Validate SKU uniqueness for all variants
      for (const variant of variants) {
        if (variant.sku) {
          const isUnique = await this.validateSKUUniqueness(variant.sku, productId);
          if (!isUnique) {
            throw new AppError(`SKU '${variant.sku}' already exists for another product. Each variant must have a unique SKU`, 400);
          }
        }
      }
    }
    
    // Generate new slug if name changed
    let slug = currentProduct.slug;
    if (name && name !== currentProduct.name) {
      slug = await generateUniqueSlug(
        name,
        async (s) => {
          const existing = await Product.findOne({ slug: s, _id: { $ne: productId } });
          return !!existing;
        },
      );
    }
    
    // Build update object only with defined fields to avoid overwriting with undefined
    const updateFields: Partial<IProductWithVariants> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (price !== undefined) updateFields.price = price;
    if (image !== undefined) updateFields.image = image;
    if (collectionId !== undefined) updateFields.collectionId = collectionId;
    if (relatedProducts !== undefined) updateFields.relatedProducts = relatedProducts;
    if (slug !== undefined) updateFields.slug = slug;
    
    // Special handling for variants to ensure inventory is preserved
    if (variants !== undefined) {
      updateFields.variants = variants.map((v): IProductVariant => {
        // Extract properties with proper type checking
        const images = v && typeof v === 'object' && 'images' in v && Array.isArray(v.images)
          ? v.images
          : [];
        
        // Create a new object to avoid spread of potentially error-typed value
        return {
          variantId: v.variantId,
          label: v.label,
          size: v.size,
          color: v.color,
          attributes: v.attributes,
          price: v.price,
          inventory: v.inventory,
          images,
          sku: v.sku,
        };
      });
    }
    
    const product = await Product.findByIdAndUpdate(
      productId,
      updateFields,
      { new: true, runValidators: true },
    );

    if (!product) {
      throw new AppError(`Product not found with ID: ${productId}`, 404);
    }

    // Handle collection changes
    if (currentProduct.collectionId?.toString() !== collectionId) {
      // Remove from old collection if exists
      if (currentProduct.collectionId) {
        await Collection.findByIdAndUpdate(
          currentProduct.collectionId,
          { $pull: { products: productId } },
        );
      }
      
      // Add to new collection if specified
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: productId } },
        );
      }
    }
    
    // Clear cache
    await this.clearProductCache(currentProduct.slug, productId);
    if (slug !== currentProduct.slug) {
      await this.clearProductCache(slug, productId);
    }

    return toProduct(product);
  }

  async deleteProduct(productId: string): Promise<void> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new AppError(`Product not found with ID: ${productId}. Cannot delete non-existent product`, 404);
    }
    
    // Delete image from UploadThing if exists
    if (product.image) {
      const fileKey = product.image.substring(product.image.lastIndexOf('/') + 1);
      try {
        await this.utapi.deleteFiles([fileKey]);
        // Deleted image from UploadThing
      } catch (error) {
        console.error('Error deleting image from UploadThing', error);
        // Do not block product deletion if image deletion fails
      }
    }
    
    // Remove product from all collections
    await Collection.updateMany(
      { products: productId },
      { $pull: { products: productId } },
    );
    
    await Product.findByIdAndDelete(productId);
  }

  async getFeaturedProducts(): Promise<IProduct[]> {
    // Try to get from cache first
    const cacheKey = CACHE_KEYS.FEATURED_PRODUCTS;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IProduct[];
    }

    // If not in cache, get from database
    const featuredProducts = await Product.find({ isFeatured: true }).lean();

    // Return empty array if no featured products, don't throw error
    if (!featuredProducts || featuredProducts.length === 0) {
      return [];
    }

    // Cache with configured TTL
    await redis.set(cacheKey, JSON.stringify(featuredProducts), 'EX', CACHE_TTL.FEATURED_PRODUCTS);

    return toProductArray(featuredProducts);
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
          slug: 1,
          isFeatured: 1,
          collectionId: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return products as IProduct[];
  }

  async getProductById(productId: string): Promise<IProductWithVariants> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError(`Product not found with ID: ${productId}`, 404);
    }
    return toProductWithVariants(product);
  }

  async toggleFeaturedProduct(productId: string): Promise<IProduct> {
    // First get the current product to check its featured status
    const currentProduct = await Product.findById(productId);
    
    if (!currentProduct) {
      throw new AppError(`Product not found with ID: ${productId}. Cannot toggle featured status`, 404);
    }
    
    // Update only the isFeatured field without triggering full validation
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isFeatured: !currentProduct.isFeatured },
      { new: true, runValidators: false },
    );
    
    // Update cache
    await this.updateFeaturedProductsCache();
    
    if (!updatedProduct) {
      throw new AppError(`Failed to update product featured status for ID: ${productId}`, 500);
    }
    
    return toProduct(updatedProduct);
  }

  private async updateFeaturedProductsCache(): Promise<void> {
    try {
      const featuredProducts = await Product.find({ isFeatured: true }).lean();
      await redis.set(CACHE_KEYS.FEATURED_PRODUCTS, JSON.stringify(featuredProducts), 'EX', CACHE_TTL.FEATURED_PRODUCTS);
    } catch (error) {
      console.error('error in update cache function', error);
    }
  }

  async createProductWithCollection(
    userId: string,
    data: Partial<IProduct> & {
      collectionId?: string;
      collectionName?: string;
    },
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
        'Provide either collectionId or collectionName, not both. You cannot specify both a collection ID and a new collection name',
        400,
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
              async (s) => !!(await Collection.findOne({ slug: s })),
            ),
            description: '',
            owner: userId,
            products: [],
            isPublic: false,
          }],
          { session },
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
          throw new AppError(`Collection not found or access denied. Collection ID: ${collectionId} does not exist or you don't have permission to add products to it`, 404);
        }
      }
      
      const { collectionName: _cn, ...productData } = data;
      
      const product = await Product.create(
        [{
          ...productData,
          collectionId,
        }],
        { session },
      );
      
      if (collectionId) {
        await Collection.findByIdAndUpdate(
          collectionId,
          { $addToSet: { products: product[0]._id } },
          { session },
        );
      }
      
      await session.commitTransaction();
      
      return {
        product: toProduct(product[0]),
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
      await session.endSession();
    }
  }

  async getProductBySlug(slug: string): Promise<IProductWithVariants> {
    const cacheKey = CACHE_KEYS.PRODUCT_SLUG(slug);
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IProductWithVariants;
    }
    
    // Normalize slug
    const normalizedSlug = generateSlug(slug);
    
    const product = await Product.findOne({ 
      slug: normalizedSlug,
      isDeleted: { $ne: true },
    })
    .populate('collectionId', 'name slug')
    .populate({
      path: 'relatedProducts',
      select: 'name price image slug',
      match: { isDeleted: { $ne: true } },
    })
    .lean();
    
    if (!product) {
      throw new AppError(`Product not found with slug: ${normalizedSlug}`, 404);
    }
    
    // Cache with configured TTL
    await redis.set(cacheKey, JSON.stringify(product), 'EX', CACHE_TTL.PRODUCT_DETAIL);
    
    return toProductWithVariants(product);
  }
  
  async getRelatedProducts(productId: string, limit: number = PRODUCT_LIMITS.MAX_RELATED_PRODUCTS): Promise<IProduct[]> {
    const cacheKey = CACHE_KEYS.RELATED_PRODUCTS(productId, limit);
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IProduct[];
    }
    
    // Convert string ID to ObjectId for aggregation
    const productObjectId = new mongoose.Types.ObjectId(productId);
    
    // Single aggregation pipeline to fetch all related products efficiently
    const pipeline: mongoose.PipelineStage[] = [
      // First, get the main product
      {
        $match: { _id: productObjectId },
      },
      // Facet to get three categories of related products
      {
        $facet: {
          // 1. Explicitly related products
          explicit: [
            {
              $lookup: {
                from: 'products',
                let: { relatedIds: '$relatedProducts' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $in: ['$_id', '$$relatedIds'] },
                          { $ne: ['$isDeleted', true] },
                        ],
                      },
                    },
                  },
                  { $limit: limit },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description: 1,
                      image: 1,
                      price: 1,
                      slug: 1,
                      priority: { $literal: 1 },
                    },
                  },
                ],
                as: 'related',
              },
            },
            { $unwind: { path: '$related', preserveNullAndEmptyArrays: true } },
            { $replaceRoot: { newRoot: { $ifNull: ['$related', { _id: null }] } } },
            { $match: { _id: { $ne: null } } },
          ],
          // 2. Products from same collection
          collection: [
            {
              $lookup: {
                from: 'products',
                let: { collectionId: '$collectionId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$collectionId', '$$collectionId'] },
                          { $ne: ['$_id', productObjectId] },
                          { $ne: ['$isDeleted', true] },
                        ],
                      },
                    },
                  },
                  { $limit: limit },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description: 1,
                      image: 1,
                      price: 1,
                      slug: 1,
                      priority: { $literal: 2 },
                    },
                  },
                ],
                as: 'related',
              },
            },
            { $unwind: { path: '$related', preserveNullAndEmptyArrays: true } },
            { $replaceRoot: { newRoot: { $ifNull: ['$related', { _id: null }] } } },
            { $match: { _id: { $ne: null } } },
          ],
          // 3. Random products
          random: [
            {
              $lookup: {
                from: 'products',
                pipeline: [
                  {
                    $match: {
                      _id: { $ne: productObjectId },
                      isDeleted: { $ne: true },
                    },
                  },
                  { $sample: { size: limit } },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                      description: 1,
                      image: 1,
                      price: 1,
                      slug: 1,
                      priority: { $literal: 3 },
                    },
                  },
                ],
                as: 'related',
              },
            },
            { $unwind: { path: '$related', preserveNullAndEmptyArrays: true } },
            { $replaceRoot: { newRoot: { $ifNull: ['$related', { _id: null }] } } },
            { $match: { _id: { $ne: null } } },
          ],
        },
      },
      // Combine all results
      {
        $project: {
          allProducts: {
            $concatArrays: ['$explicit', '$collection', '$random'],
          },
        },
      },
      { $unwind: '$allProducts' },
      { $replaceRoot: { newRoot: '$allProducts' } },
      // Remove duplicates and sort by priority
      { $group: { _id: '$_id', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { priority: 1 } },
      { $limit: limit },
      // Remove the priority field
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          image: 1,
          price: 1,
          slug: 1,
        },
      },
    ];
    
    const result = await Product.aggregate(pipeline);
    
    if (result.length === 0) {
      throw new AppError(`Product not found with ID: ${productId}. Cannot fetch related products`, 404);
    }
    
    // Cache with configured TTL
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.RELATED_PRODUCTS);
    
    return result as IProduct[];
  }
  
  calculateVariantPrice(basePrice: number, variant: IProductVariant): number {
    // For now, use variant price if specified, otherwise use base price
    return variant.price || basePrice;
  }
  
  async checkVariantAvailability(productId: string, variantId?: string, variantLabel?: string): Promise<boolean> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new AppError(`Product not found with ID: ${productId}. Cannot check variant availability`, 404);
    }
    
    const { variant } = getVariantOrDefault(product.variants, variantLabel, variantId);
    
    if (!variant) {
      throw new AppError(`Variant not found for product ${productId}`, 404);
    }
    
    return variant.inventory > 0;
  }
  
  async updateVariantInventory(
    productId: string, 
    variantId?: string,
    quantity = 1,
    operation: 'increment' | 'decrement' | 'set' = 'set',
    maxRetries = RETRY_CONFIG.MAX_INVENTORY_UPDATE_RETRIES,
    variantLabel?: string,
  ): Promise<IProductVariant> {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const product = await Product.findById(productId);
        
        if (!product) {
          throw new AppError(`Product not found with ID: ${productId}. Cannot update variant inventory`, 404);
        }
        
        // Map incoming size to label when flag is ON  
        const effectiveVariantId = variantId;
        let effectiveVariantLabel = variantLabel;
        
        if (USE_VARIANT_LABEL && variantId && !variantLabel) {
          effectiveVariantLabel = variantId;
        }
        
        const { variant } = getVariantOrDefault(product.variants, effectiveVariantLabel, effectiveVariantId);
        
        if (!variant) {
          throw new AppError(`Variant not found for product ${productId}`, 404);
        }
        
        // Find the variant index for direct update
        const variantIndex = product.variants.findIndex(v => 
          USE_VARIANT_LABEL && effectiveVariantLabel ? 
            v.label === effectiveVariantLabel : 
            v.variantId === effectiveVariantId,
        );
        
        if (variantIndex === -1) {
          throw new AppError(`Variant not found for product ${productId}`, 404);
        }
        
        const targetVariant = product.variants[variantIndex];
        
        switch (operation) {
          case 'increment':
            targetVariant.inventory += quantity;
            break;
          case 'decrement':
            if (targetVariant.inventory < quantity) {
              throw new AppError(
                `Insufficient inventory for variant. Available: ${targetVariant.inventory}, Requested: ${quantity}. Please reduce the quantity or choose a different variant`, 
                400,
              );
            }
            targetVariant.inventory -= quantity;
            break;
          case 'set':
            if (quantity < 0) {
              throw new AppError(`Inventory cannot be negative. Attempted to set inventory to ${quantity}`, 400);
            }
            targetVariant.inventory = quantity;
            break;
        }
        
        // This will throw a VersionError if the document was modified concurrently
        await product.save();
        
        // Clear cache
        await this.clearProductCache(product.slug, productId);
        
        return targetVariant;
      } catch (error) {
        // Handle optimistic concurrency control errors
        if (error instanceof Error && error.name === 'VersionError' && retryCount < maxRetries - 1) {
          retryCount++;
          // Add exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(RETRY_CONFIG.EXPONENTIAL_BACKOFF_BASE, retryCount) * RETRY_CONFIG.BASE_RETRY_DELAY_MS));
          continue;
        }
        
        // Re-throw other errors or if max retries reached
        throw error;
      }
    }
    
    throw new AppError(`Failed to update inventory for variant after ${maxRetries} retries due to concurrent modifications. Please try again`, 503);
  }
  
  async validateSKUUniqueness(sku: string, excludeProductId?: string): Promise<boolean> {
    const query: mongoose.FilterQuery<IProduct> = { 'variants.sku': sku };
    
    if (excludeProductId) {
      query._id = { $ne: excludeProductId };
    }
    
    const existing = await Product.findOne(query);
    
    return !existing;
  }
  
  private async clearProductCache(slug?: string, productId?: string): Promise<void> {
    try {
      const keysToDelete: string[] = [];
      
      // Clear specific product cache
      if (slug) {
        keysToDelete.push(CACHE_KEYS.PRODUCT_SLUG(slug));
      }
      
      // Clear related products cache for this product
      if (productId) {
        // Find all related product cache keys for this product
        const relatedPattern = `related:${productId}:*`;
        const relatedKeys = await this.scanRedisKeys(relatedPattern);
        keysToDelete.push(...relatedKeys);
        
        // Also clear cache for products that have this product as related
        const reverseRelatedPattern = 'related:*';
        const allRelatedKeys = await this.scanRedisKeys(reverseRelatedPattern);
        // In production, you might want to check which ones actually contain this product
        keysToDelete.push(...allRelatedKeys);
      }
      
      // Only clear featured products cache if necessary
      const product = productId ? await Product.findById(productId).select('isFeatured').lean() : null;
      if (!product || product.isFeatured) {
        keysToDelete.push(CACHE_KEYS.FEATURED_PRODUCTS);
      }
      
      // Delete all keys in batch
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    } catch (error) {
      console.error('Error clearing product cache:', error);
    }
  }
  
  private async scanRedisKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', REDIS_SCAN_CONFIG.SCAN_COUNT);
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    
    return keys;
  }
}

export const productService = new ProductService();

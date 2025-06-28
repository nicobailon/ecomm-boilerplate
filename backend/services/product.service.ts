import mongoose from 'mongoose';
import { Product, IProductDocument } from '../models/product.model.js';
import { AppError, NotFoundError, ValidationError, ConflictError, InventoryError } from '../utils/AppError.js';
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
import { MediaCacheService } from './mediaCache.service.js';
import { IMediaItem } from '../types/media.types.js';
import { logTransactionError } from '../lib/logger.js';

class ProductService {
  private utapi = new UTApi();

  async getAllProducts(
    page: number = PAGINATION.DEFAULT_PAGE, 
    limit: number = PAGINATION.DEFAULT_LIMIT, 
    search?: string,
    includeVariants = false,
    filters?: {
      collectionId?: string;
      isFeatured?: boolean;
      sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
      stockStatus?: 'all' | 'inStock' | 'lowStock' | 'outOfStock';
    }
  ): Promise<{ products: (IProduct | IProductWithVariants)[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
    // Validate and sanitize pagination parameters
    const pageNum = Math.max(PAGINATION.DEFAULT_PAGE, page);
    const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(PAGINATION.MIN_LIMIT, limit));
    
    const query: mongoose.FilterQuery<IProductDocument> = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Apply filters
    if (filters?.collectionId) {
      query.collectionId = filters.collectionId;
    }
    
    if (filters?.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    
    // Apply stock status filter
    if (filters?.stockStatus && filters.stockStatus !== 'all') {
      switch (filters.stockStatus) {
        case 'inStock':
          query.$or = [
            { variants: { $exists: false }, inventory: { $gt: 0 } },
            { 'variants.inventory': { $gt: 0 } }
          ];
          break;
        case 'lowStock':
          query.$or = [
            { variants: { $exists: false }, inventory: { $lte: 10, $gt: 0 } },
            { 'variants.inventory': { $lte: 10, $gt: 0 } }
          ];
          break;
        case 'outOfStock':
          query.$or = [
            { variants: { $exists: false }, inventory: { $lte: 0 } },
            { 'variants.inventory': { $lte: 0 } }
          ];
          break;
      }
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    let productsQuery = Product.find(query);
    
    // Apply sorting
    if (search) {
      productsQuery = productsQuery.sort({ score: { $meta: 'textScore' } });
    } else if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      productsQuery = productsQuery.sort({ [filters.sortBy]: sortOrder });
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
      throw new ValidationError('Product image URL is required. Please upload an image for the product');
    }
    
    if (variants.length > 0) {
      validateUniqueVariants(variants);
      validateVariantInventory(variants);
      
      // Validate SKU uniqueness for all variants
      for (const variant of variants) {
        if (variant.sku) {
          const isUnique = await this.validateSKUUniqueness(variant.sku);
          if (!isUnique) {
            throw new ConflictError('SKU', variant.sku);
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
          throw new NotFoundError('Collection', collectionId);
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
      throw new NotFoundError('Product', productId);
    }
    
    // Validate new collection exists if provided
    if (collectionId !== undefined && collectionId !== null) {
      const collectionExists = await Collection.findById(collectionId);
      if (!collectionExists) {
        throw new NotFoundError('Collection', collectionId);
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
            throw new ConflictError('SKU', variant.sku);
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
      throw new NotFoundError('Product', productId);
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
      throw new NotFoundError('Product', productId);
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

  async getFeaturedProducts(bypassCache = false): Promise<IProduct[]> {
    // Try to get from cache first unless bypass is requested
    const cacheKey = CACHE_KEYS.FEATURED_PRODUCTS;
    if (!bypassCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as IProduct[];
      }
    }

    // If not in cache or bypassing cache, get from database
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
    // Try cache first for media
    const cachedMedia = await MediaCacheService.getCachedMedia(productId);
    
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    const productData = toProductWithVariants(product);
    
    // Use cached media if available and current media is empty/missing
    if (cachedMedia && (!product.mediaGallery || product.mediaGallery.length === 0)) {
      productData.mediaGallery = cachedMedia;
    } else if (product.mediaGallery && product.mediaGallery.length > 0) {
      // Cache the media gallery
      await MediaCacheService.setCachedMedia(productId, product.mediaGallery);
    }
    
    return productData;
  }

  async toggleFeaturedProduct(productId: string): Promise<IProduct> {
    // First get the current product to check its featured status
    const currentProduct = await Product.findById(productId);
    
    if (!currentProduct) {
      throw new NotFoundError('Product', productId);
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
          throw new NotFoundError('Collection', collectionId);
        }
      }
      
      const { collectionName: _cn, ...productData } = data;

      // Validate required fields with explicit runtime checks
      if (!productData.name || typeof productData.name !== 'string' || productData.name.trim() === '') {
        throw new ValidationError('Product name is required and must be a non-empty string');
      }

      // Generate slug for the product
      const slug = await generateUniqueSlug(
        productData.name,
        async (s) => !!(await Product.findOne({ slug: s })),
      );

      const product = await Product.create(
        [{
          ...productData,
          collectionId,
          slug,
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

      // Re-throw AppError instances as-is to preserve error context
      if (error instanceof AppError) {
        throw error;
      }

      // Log transaction error with structured logging
      logTransactionError({
        operation: 'createProductWithCollection',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Wrap other errors with transaction context
      throw new AppError(
        `Transaction failed during product creation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
      );
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
      throw new NotFoundError('Product', normalizedSlug);
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
      throw new NotFoundError('Product', productId);
    }
    
    // Cache with configured TTL
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.RELATED_PRODUCTS);
    
    return result as IProduct[];
  }
  
  calculateVariantPrice(basePrice: number, variant: IProductVariant): number {
    // For now, use variant price if specified, otherwise use base price
    return variant.price ?? basePrice;
  }
  
  async checkVariantAvailability(productId: string, variantId?: string, variantLabel?: string): Promise<boolean> {
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError('Product', productId);
    }
    
    const { variant } = getVariantOrDefault(product.variants, variantLabel, variantId);
    
    if (!variant) {
      throw new NotFoundError('Variant', productId);
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
          throw new NotFoundError('Product', productId);
        }
        
        // Map incoming size to label when flag is ON  
        const effectiveVariantId = variantId;
        let effectiveVariantLabel = variantLabel;
        
        if (USE_VARIANT_LABEL && variantId && !variantLabel) {
          effectiveVariantLabel = variantId;
        }
        
        const { variant } = getVariantOrDefault(product.variants, effectiveVariantLabel, effectiveVariantId);
        
        if (!variant) {
          throw new NotFoundError('Variant', productId);
        }
        
        // Find the variant index for direct update
        const variantIndex = product.variants.findIndex(v => 
          USE_VARIANT_LABEL && effectiveVariantLabel ? 
            v.label === effectiveVariantLabel : 
            v.variantId === effectiveVariantId,
        );
        
        if (variantIndex === -1) {
          throw new NotFoundError('Variant', productId);
        }
        
        const targetVariant = product.variants[variantIndex];
        
        switch (operation) {
          case 'increment':
            targetVariant.inventory += quantity;
            break;
          case 'decrement':
            if (targetVariant.inventory < quantity) {
              throw new InventoryError(
                `Insufficient inventory for variant. Available: ${targetVariant.inventory}, Requested: ${quantity}. Please reduce the quantity or choose a different variant`,
                'INSUFFICIENT_INVENTORY',
                [{
                  productId: productId,
                  variantId: targetVariant.variantId,
                  requestedQuantity: quantity,
                  availableStock: targetVariant.inventory
                }]
              );
            }
            targetVariant.inventory -= quantity;
            break;
          case 'set':
            if (quantity < 0) {
              throw new ValidationError(`Inventory cannot be negative. Attempted to set inventory to ${quantity}`);
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
        
        // Clear media cache for this product
        await MediaCacheService.invalidateMediaCache(productId);
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

  async updateMediaGallery(
    productId: string,
    mediaItems: IMediaItem[],
    userId: string,
  ): Promise<IProduct> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      interface MediaServiceInterface {
        validateMediaGallery: (items: IMediaItem[]) => Promise<void>;
        deleteMediaFiles: (urls: string[]) => Promise<void>;
      }
      let service: MediaServiceInterface;
      try {
        const { mediaService } = await import('./media.service.js');
        service = {
          validateMediaGallery: (items: IMediaItem[]) => {
            mediaService.validateMediaGallery(items);
            return Promise.resolve();
          },
          deleteMediaFiles: (urls: string[]) => {
            mediaService.deleteMediaFiles(urls);
            return Promise.resolve();
          },
        };
      } catch {
        service = {
          validateMediaGallery: (items: IMediaItem[]) => {
            if (items.length > 6) {
              throw new ValidationError('Maximum 6 media items allowed');
            }
            return Promise.resolve();
          },
          deleteMediaFiles: async (_urls: string[]) => {
            // Media service stub - would delete files in production
          },
        };
      }
      
      await service.validateMediaGallery(mediaItems);
      
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new NotFoundError('Product');
      }
      
      const oldMediaUrls = (product.mediaGallery ?? [])
        .filter((m) => m.url.includes('utfs.io'))
        .map((m) => m.url);
      
      const firstImage = mediaItems.find(item => item.type === 'image');
      if (firstImage) {
        product.image = firstImage.url;
      }
      
      product.mediaGallery = mediaItems;
      
      await product.save({ session });
      
      const newUrls = new Set(mediaItems.map(m => m.url));
      const orphanedUrls = oldMediaUrls.filter(url => !newUrls.has(url));
      if (orphanedUrls.length > 0) {
        service.deleteMediaFiles(orphanedUrls).catch(console.error);
      }
      
      await this.logMediaAudit(productId, 'media_gallery_update', userId, {
        oldCount: oldMediaUrls.length,
        newCount: mediaItems.length,
      });
      
      await this.clearProductCache(product.slug, productId);
      
      await session.commitTransaction();
      return toProduct(product);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async reorderMediaItems(
    productId: string,
    mediaOrder: { id: string; order: number }[],
    userId: string,
  ): Promise<IProduct> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          throw new NotFoundError('Product');
        }
        
        if (!product.mediaGallery) {
          product.mediaGallery = [];
        }
        
        const orderMap = new Map(mediaOrder.map(item => [item.id, item.order]));
        
        const reorderedItems = product.mediaGallery.map((item) => ({
          ...item,
          order: orderMap.get(item.id) ?? item.order,
        }));
        
        reorderedItems.sort((a, b) => a.order - b.order);
        
        product.mediaGallery = reorderedItems;
        
        const firstImage = reorderedItems.find(item => item.type === 'image');
        if (firstImage && product.image !== firstImage.url) {
          product.image = firstImage.url;
        }
        
        await product.save();
        
        await this.logMediaAudit(productId, 'media_reorder', userId, {
          itemCount: mediaOrder.length,
        });
        
        await this.clearProductCache(product.slug, productId);
        
        return toProduct(product);
      } catch (error) {
        if (error instanceof Error && error.name === 'VersionError' && retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => 
            setTimeout(resolve, 100 * Math.pow(2, retryCount)),
          );
          continue;
        }
        throw error;
      }
    }
    
    throw new AppError('Failed to reorder media after multiple attempts', 500);
  }

  async deleteMediaItem(
    productId: string,
    mediaId: string,
    userId: string,
  ): Promise<IProduct> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new NotFoundError('Product');
      }
      
      if (!product.mediaGallery) {
        product.mediaGallery = [];
      }
      
      const mediaItem = product.mediaGallery.find((m) => m.id === mediaId);
      if (!mediaItem) {
        throw new NotFoundError('Media item');
      }
      
      const imageCount = product.mediaGallery.filter((m) => m.type === 'image').length;
      if (mediaItem.type === 'image' && imageCount === 1) {
        throw new ValidationError('Cannot delete the last image');
      }
      
      product.mediaGallery = product.mediaGallery.filter((m) => m.id !== mediaId);
      
      product.mediaGallery.forEach((item, index) => {
        item.order = index;
      });
      
      if (mediaItem.url === product.image) {
        const firstImage = product.mediaGallery.find((m) => m.type === 'image');
        if (firstImage) {
          product.image = firstImage.url;
        }
      }
      
      await product.save({ session });
      
      if (mediaItem.url.includes('utfs.io')) {
        try {
          const { mediaService } = await import('./media.service.js');
          try {
            mediaService.deleteMediaFiles([mediaItem.url]);
          } catch (error) {
            console.error(error);
          }
        } catch {
          // MediaService not available, skipping file deletion
        }
      }
      
      await this.logMediaAudit(productId, 'media_delete', userId, {
        deletedItemId: mediaId,
        deletedItemUrl: mediaItem.url,
      });
      
      await this.clearProductCache(product.slug, productId);
      
      await session.commitTransaction();
      return toProduct(product);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async addMediaItem(
    productId: string,
    mediaItem: IMediaItem,
    userId: string,
  ): Promise<IProduct> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    if (!product.mediaGallery) {
      product.mediaGallery = [];
    }
    
    if (product.mediaGallery.length >= 6) {
      throw new ValidationError('Media gallery is full');
    }
    
    mediaItem.order = product.mediaGallery.length;
    
    product.mediaGallery.push(mediaItem);
    await product.save();
    
    await this.logMediaAudit(productId, 'media_add', userId, {
      addedItemId: mediaItem.id,
      addedItemType: mediaItem.type,
    });
    
    await this.clearProductCache(product.slug, productId);
    
    return toProduct(product);
  }

  async getProductsWithMedia(
    filter: Record<string, unknown> = {},
    options: { sort?: Record<string, 1 | -1>; limit?: number } = {},
  ): Promise<IProduct[]> {
    const products = await Product.find({
      ...filter,
      isDeleted: { $ne: true },
    })
    .populate('mediaGallery')
    .sort(options.sort ?? { createdAt: -1 })
    .limit(options.limit ?? 50);
    
    return products.map(toProduct);
  }

  async validateMediaConsistency(productId: string): Promise<boolean> {
    const product = await Product.findById(productId);
    if (!product) return false;
    
    if (product.mediaGallery && product.mediaGallery.length > 0) {
      const firstImage = product.mediaGallery.find((m) => m.type === 'image');
      if (firstImage && product.image !== firstImage.url) {
        product.image = firstImage.url;
        await product.save();
        await this.clearProductCache(product.slug, productId);
      }
    }
    
    return true;
  }

  async bulkUpdateMediaGalleries(
    updates: { productId: string; mediaGallery: IMediaItem[] }[],
    userId: string,
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      for (const update of updates) {
        await this.updateMediaGallery(
          update.productId,
          update.mediaGallery,
          userId,
        );
      }
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async logMediaAudit(
    productId: string,
    action: string,
    userId: string,
    metadata?: unknown,
  ): Promise<void> {
    // Media audit logging for compliance and debugging
    
    try {
      await redis.zadd(
        `audit:media:${productId}`,
        Date.now(),
        JSON.stringify({ action, userId, metadata }),
      );
      
      await redis.zremrangebyrank(`audit:media:${productId}`, 0, -101);
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }
}

export const productService = new ProductService();

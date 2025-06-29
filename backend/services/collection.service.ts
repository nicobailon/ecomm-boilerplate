import mongoose from 'mongoose';
import { Collection, ICollection } from '../models/collection.model.js';
import { Product } from '../models/product.model.js';
import { AppError, NotFoundError } from '../utils/AppError.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import { escapeRegExp } from '../utils/escapeRegex.js';
import {
  CreateCollectionInput,
  UpdateCollectionInput,
  UpdateHeroContentInput,
} from '../validations/collection.validation.js';

interface CollectionQuery {
  owner?: string;
  isPublic?: boolean;
  _id?: { $lt: string };
}

export class CollectionService {
  async create(
    userId: string,
    input: CreateCollectionInput,
  ): Promise<ICollection> {
    const { name, description, isPublic, products } = input;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (products.length > 0) {
        const validProducts = await Product.find({
          _id: { $in: products },
        }).select('_id').session(session);

        if (validProducts.length !== products.length) {
          throw new AppError('One or more product IDs are invalid', 400);
        }
      }

      const slug = await generateUniqueSlug(name, async (slug) => {
        const exists = await Collection.findOne({ slug }).session(session);
        return !!exists;
      });

      const collection = new Collection({
        name,
        description,
        slug,
        owner: userId,
        products,
        isPublic,
      });

      await collection.save({ session });

      if (products.length > 0) {
        // First, remove these products from any existing collections
        const productsWithCollections = await Product.find({
          _id: { $in: products },
          collectionId: { $exists: true },
        }).select('collectionId').session(session);

        const existingCollectionIds = [...new Set(
          productsWithCollections
            .map(p => p.collectionId?.toString())
            .filter(Boolean),
        )];

        if (existingCollectionIds.length > 0) {
          await Collection.updateMany(
            { _id: { $in: existingCollectionIds } },
            { $pull: { products: { $in: products } } },
            { session },
          );
        }

        // Now update the products to point to the new collection
        await Product.updateMany(
          { _id: { $in: products } },
          { $set: { collectionId: collection._id } },
          { session },
        );
      }

      await session.commitTransaction();
      
      // Return the populated collection
      const populatedCollection = await Collection.findById(collection._id)
        .populate('owner', 'name email')
        .populate({
          path: 'products',
          select: '_id name description price image category isFeatured collectionId slug',
        });
        
      if (!populatedCollection) {
        throw new AppError('Failed to load collection after creation', 500);
      }
      return populatedCollection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async update(
    collectionId: string,
    userId: string,
    input: UpdateCollectionInput,
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      const collection = await Collection.findOne({
        _id: collectionId,
        owner: userId,
      }).session(session);

      if (!collection) {
        throw new AppError('Collection not found or unauthorized', 404);
      }

      if (input.name && input.name !== collection.name) {
        collection.slug = await generateUniqueSlug(input.name, async (slug) => {
          const exists = await Collection.findOne({
            slug,
            _id: { $ne: collectionId },
          }).session(session);
          return !!exists;
        });
      }

      Object.assign(collection, input);
      await collection.save({ session });
      
      await session.commitTransaction();
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async delete(collectionId: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findOne({
        _id: collectionId,
        owner: userId,
      }).session(session);
      
      if (!collection) {
        throw new AppError('Collection not found or unauthorized', 404);
      }
      
      if (collection.products.length > 0) {
        await Product.updateMany(
          { _id: { $in: collection.products } },
          { $unset: { collectionId: 1 } },
          { session },
        );
      }
      
      await collection.deleteOne({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async addProducts(
    collectionId: string,
    userId: string,
    productIds: string[],
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();
      
      const collection = await Collection.findOne({
        _id: collectionId,
        owner: userId,
      }).session(session);

      if (!collection) {
        throw new AppError('Collection not found or unauthorized', 404);
      }

      const validProducts = await Product.find({
        _id: { $in: productIds },
      }).select('_id').session(session);

      if (validProducts.length !== productIds.length) {
        throw new AppError('One or more product IDs are invalid', 400);
      }

      const existingProductIds = collection.products.map((id) => id.toString());
      const newProductIds = productIds.filter(
        (id) => !existingProductIds.includes(id),
      );

      if (newProductIds.length > 0) {
        collection.products.push(
          ...newProductIds.map((id) => new mongoose.Types.ObjectId(id)),
        );
        
        await Product.updateMany(
          { _id: { $in: newProductIds } },
          { $set: { collectionId: collection._id } },
          { session },
        );
        
        await collection.save({ session });
      }
      
      await session.commitTransaction();
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeProducts(
    collectionId: string,
    userId: string,
    productIds: string[],
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findOneAndUpdate(
        { _id: collectionId, owner: userId },
        { 
          $pullAll: { 
            products: productIds.map(id => new mongoose.Types.ObjectId(id)), 
          }, 
        },
        { new: true, session },
      );

      if (!collection) {
        throw new AppError('Collection not found or unauthorized', 404);
      }
      
      await Product.updateMany(
        { _id: { $in: productIds }, collectionId },
        { $unset: { collectionId: 1 } },
        { session },
      );
      
      await session.commitTransaction();
      return collection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  private async getCollectionWithAuth(
    query: mongoose.FilterQuery<ICollection>,
    requesterId?: string,
  ): Promise<ICollection | null> {
    const collection = await Collection.findOne(query)
      .populate('owner', 'name email')
      .populate({
        path: 'products',
        model: 'Product',
        select: '_id name description price image category isFeatured collectionId slug',
        match: { _id: { $exists: true } }, // Only populate existing products
      })
      .lean(); // Use lean for better performance and easier debugging

    if (!collection) {
      return null;
    }

    // Filter out any null products (deleted products)
    if (collection.products) {
      collection.products = collection.products.filter((p) => p !== null);
    }

    if (!collection.isPublic && collection.owner._id.toString() !== requesterId) {
      throw new AppError('Collection is private', 403);
    }

    return collection as ICollection;
  }

  async getById(collectionId: string, requesterId?: string): Promise<ICollection | null> {
    return this.getCollectionWithAuth({ _id: collectionId }, requesterId);
  }

  async getBySlug(slug: string, requesterId?: string): Promise<ICollection | null> {
    return this.getCollectionWithAuth({ slug }, requesterId);
  }

  async list(options: {
    userId?: string;
    isPublic?: boolean;
    limit: number;
    cursor?: string;
    // Page-based pagination
    page?: number;
    // Sorting
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
    sortOrder?: 'asc' | 'desc';
    // Filtering
    search?: string;
  }): Promise<{ 
    collections: ICollection[]; 
    nextCursor: string | null;
    // Page-based response
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { 
      userId, 
      isPublic, 
      limit, 
      cursor,
      page,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = options;

    const query: CollectionQuery = {};

    if (userId) {
      query.owner = userId;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), 'i');
      (query as any).$or = [
        { name: searchRegex },
        { description: searchRegex },
      ];
    }

    // Use page-based pagination if page is provided
    if (page !== undefined) {
      const skip = (page - 1) * limit;
      
      // Determine sort field
      let sortField: string = sortBy;
      if (sortBy === 'productCount') {
        // For product count, we'll need to use aggregation or sort by array length
        sortField = 'products';
      }
      
      const sortOptions: Record<string, 1 | -1> = {
        [sortField]: sortOrder === 'asc' ? 1 : -1,
      };
      
      const [collections, total] = await Promise.all([
        Collection.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('owner', 'name email')
          .populate({
            path: 'products',
            select: '_id name description price image category isFeatured collectionId slug',
          }),
        Collection.countDocuments(query),
      ]);

      return {
        collections,
        nextCursor: null,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    }

    // Original cursor-based pagination
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const collections = await Collection.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('owner', 'name email')
      .populate({
        path: 'products',
        select: '_id name description price image category isFeatured collectionId slug',
      });

    let nextCursor: string | null = null;

    if (collections.length > limit) {
      const nextItem = collections.pop();
      if (nextItem) {
        nextCursor = (nextItem._id as mongoose.Types.ObjectId).toString();
      }
    }

    return { collections, nextCursor };
  }

  async getUserCollections(
    userId: string,
    options: {
      limit: number;
      cursor?: string;
      page?: number;
      sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'productCount';
      sortOrder?: 'asc' | 'desc';
      search?: string;
      isPublic?: boolean;
    },
  ): Promise<{ 
    collections: ICollection[]; 
    nextCursor: string | null;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.list({
      userId,
      limit: options.limit,
      cursor: options.cursor,
      page: options.page,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder,
      search: options.search,
      isPublic: options.isPublic,
    });
  }

  async quickCreate(
    userId: string,
    data: { name: string; isPublic?: boolean },
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const slug = await generateUniqueSlug(
        data.name,
        async (s) => {
          const exists = await Collection.findOne({ slug: s }).session(session);
          return !!exists;
        },
      );
      
      const collection = await Collection.create(
        [{
          name: data.name.trim(),
          slug,
          description: '',
          owner: userId,
          products: [],
          isPublic: data.isPublic ?? true,
        }],
        { session },
      );
      
      await session.commitTransaction();
      return collection[0] as ICollection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async checkNameAvailability(
    userId: string,
    name: string,
  ): Promise<{
    available: boolean;
    suggestedName?: string;
    existingId?: string;
  }> {
    const slug = generateSlug(name);
    
    const exactMatch = await Collection.findOne({ 
      slug,
      owner: userId, 
    });
    
    if (exactMatch) {
      return {
        available: false,
        existingId: (exactMatch._id as mongoose.Types.ObjectId).toString(),
      };
    }
    
    const escapedSlug = escapeRegExp(slug);
    
    const count = await Collection.countDocuments({
      slug: { $regex: `^${escapedSlug}`, $options: 'i' },
      owner: userId,
    });
    
    if (count > 0) {
      return {
        available: false,
        suggestedName: `${name} ${count + 1}`,
      };
    }
    
    return { available: true };
  }

  async setProductsForCollection(
    collectionId: string,
    userId: string,
    productIds: string[],
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const collection = await Collection.findOne({
        _id: collectionId,
        owner: userId,
      }).session(session);

      if (!collection) {
        throw new AppError('Collection not found or unauthorized', 404);
      }

      const currentProductIds = collection.products.map(id => id.toString());
      
      const productsToAdd = productIds.filter(id => !currentProductIds.includes(id));
      const productsToRemove = currentProductIds.filter(id => !productIds.includes(id));

      if (productsToAdd.length > 0) {
        const validProducts = await Product.find({
          _id: { $in: productsToAdd },
        }).select('_id').session(session);

        if (validProducts.length !== productsToAdd.length) {
          throw new AppError('One or more product IDs are invalid', 400);
        }
      }

      if (productsToRemove.length > 0) {
        await Product.updateMany(
          { _id: { $in: productsToRemove } },
          { $unset: { collectionId: 1 } },
          { session },
        );
      }

      if (productsToAdd.length > 0) {
        await Product.updateMany(
          { _id: { $in: productsToAdd } },
          { $set: { collectionId: collection._id } },
          { session },
        );
      }

      collection.products = productIds.map(id => new mongoose.Types.ObjectId(id));
      await collection.save({ session });
      
      await session.commitTransaction();
      
      const populatedCollection = await Collection.findById(collection._id)
        .populate('owner', 'name email')
        .populate({
          path: 'products',
          select: '_id name description price image category isFeatured collectionId slug',
        });
        
      if (!populatedCollection) {
        throw new AppError('Failed to load collection after creation', 500);
      }
      return populatedCollection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateHeroContent(
    collectionId: string,
    userId: string,
    input: Omit<UpdateHeroContentInput, 'id'>,
  ): Promise<ICollection> {
    const collection = await Collection.findOne({
      _id: collectionId,
      owner: userId,
    });

    if (!collection) {
      throw new AppError('Collection not found or unauthorized', 404);
    }

    Object.assign(collection, input);
    await collection.save();
    
    return collection;
  }

  async getFeaturedCollections(): Promise<ICollection[]> {
    return Collection.find({
      isFeatured: true,
      isPublic: true,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('owner', 'name email')
      .populate({
        path: 'products',
        select: '_id name description price image category isFeatured collectionId slug',
      });
  }

  // Admin-specific methods for collection management
  async adminUpdate(
    collectionId: string,
    _adminUserId: string, // Prefixed with underscore to indicate intentionally unused
    updateData: UpdateCollectionInput,
  ): Promise<ICollection> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const collection = await Collection.findById(collectionId).session(session);

      if (!collection) {
        throw new NotFoundError('Collection');
      }

      // Admin can update any collection
      Object.assign(collection, updateData);

      // Update the updatedAt timestamp
      collection.updatedAt = new Date();

      await collection.save({ session });
      await session.commitTransaction();

      const updatedCollection = await this.getCollectionWithAuth({ _id: collectionId });
      if (!updatedCollection) {
        throw new NotFoundError('Collection', collectionId);
      }

      return updatedCollection;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async adminDelete(collectionId: string, _adminUserId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const collection = await Collection.findById(collectionId).session(session);

      if (!collection) {
        throw new NotFoundError('Collection');
      }

      // Admin can delete any collection
      await Collection.findByIdAndDelete(collectionId).session(session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export const collectionService = new CollectionService();
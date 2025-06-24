import { vi, type MockedFunction, type Mock as MockType } from 'vitest';
import mongoose from 'mongoose';
import type { Collection, ICollection } from '../../models/collection.model.js';
import type { Product, IProductDocument } from '../../models/product.model.js';
import type { IProductVariantDocument } from '../../types/product.types.js';

// Type-safe query mock that matches Mongoose Query interface
interface QueryMockMethods<T> {
  populate: MockType<() => QueryMockMethods<T>>;
  sort: MockType<() => QueryMockMethods<T>>;
  limit: MockType<() => QueryMockMethods<T>>;
  skip: MockType<() => QueryMockMethods<T>>;
  select: MockType<() => QueryMockMethods<T>>;
  lean: MockType<() => QueryMockMethods<T>>;
  session: MockType<() => QueryMockMethods<T>>;
  exec: MockType<() => Promise<T>>;
  then: <TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) => Promise<TResult1 | TResult2>;
}

// Type-safe mock utilities without any types
export class TypedMockUtils {
  // Create a properly typed query mock
  static createTypedQueryMock<T>(result: T): QueryMockMethods<T> {
    const query = {} as QueryMockMethods<T>;
    
    // Initialize all methods
    query.populate = vi.fn(() => query);
    query.sort = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.skip = vi.fn(() => query);
    query.select = vi.fn(() => query);
    query.lean = vi.fn(() => query);
    query.session = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    query.then = (onfulfilled, onrejected) => {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    };

    return query;
  }

  // Product.find mock with exact type signature
  static createProductFindMock<T extends Partial<IProductDocument>>(
    result: T[],
  ): MockedFunction<typeof Product.find> {
    const mockFind = vi.fn() as MockedFunction<typeof Product.find>;
    const queryMock = this.createTypedQueryMock(result);
    
    mockFind.mockReturnValue(queryMock as unknown as ReturnType<typeof Product.find>);
    return mockFind;
  }

  // Product.findById mock with exact type signature
  static createProductFindByIdMock<T extends Partial<IProductDocument>>(
    result: T | null,
  ): MockedFunction<typeof Product.findById> {
    const mockFindById = vi.fn() as MockedFunction<typeof Product.findById>;
    const queryMock = this.createTypedQueryMock(result);
    
    mockFindById.mockReturnValue(queryMock as unknown as ReturnType<typeof Product.findById>);
    return mockFindById;
  }

  // Product.findOneAndUpdate mock with exact type signature
  static createProductFindOneAndUpdateMock<T extends Partial<IProductDocument>>(
    result: T | null,
  ): MockedFunction<typeof Product.findOneAndUpdate> {
    const mockFindOneAndUpdate = vi.fn() as MockedFunction<typeof Product.findOneAndUpdate>;
    mockFindOneAndUpdate.mockResolvedValue(result as IProductDocument | null);
    return mockFindOneAndUpdate;
  }

  // Product.aggregate mock with precise typing
  static createProductAggregateMock<T extends Record<string, unknown>>(
    result: T[],
  ): MockedFunction<typeof Product.aggregate> {
    const mockAggregate = vi.fn() as MockedFunction<typeof Product.aggregate>;
    mockAggregate.mockResolvedValue(result);
    return mockAggregate;
  }

  // Collection.find mock with exact type signature
  static createCollectionFindMock<T extends Partial<ICollection>>(
    result: T[],
  ): MockedFunction<typeof Collection.find> {
    const mockFind = vi.fn() as MockedFunction<typeof Collection.find>;
    const queryMock = this.createTypedQueryMock(result);
    
    mockFind.mockReturnValue(queryMock as unknown as ReturnType<typeof Collection.find>);
    return mockFind;
  }

  // Collection.findById mock with exact type signature
  static createCollectionFindByIdMock<T extends Partial<ICollection>>(
    result: T | null,
  ): MockedFunction<typeof Collection.findById> {
    const mockFindById = vi.fn() as MockedFunction<typeof Collection.findById>;
    const queryMock = this.createTypedQueryMock(result);
    
    mockFindById.mockReturnValue(queryMock as unknown as ReturnType<typeof Collection.findById>);
    return mockFindById;
  }

  // Collection.findOne mock with exact type signature
  static createCollectionFindOneMock<T extends Partial<ICollection>>(
    result: T | null,
  ): MockedFunction<typeof Collection.findOne> {
    const mockFindOne = vi.fn() as MockedFunction<typeof Collection.findOne>;
    const queryMock = this.createTypedQueryMock(result);
    
    mockFindOne.mockReturnValue(queryMock as unknown as ReturnType<typeof Collection.findOne>);
    return mockFindOne;
  }

  // Collection.create mock with proper array typing
  static createCollectionCreateMock<T extends Partial<ICollection>>(
    result: T[],
  ): MockedFunction<typeof Collection.create> {
    const mockCreate = vi.fn() as MockedFunction<typeof Collection.create>;
    // Collection.create with session returns array - cast through unknown for type safety
    mockCreate.mockResolvedValue(result as unknown as Parameters<typeof mockCreate.mockResolvedValue>[0]);
    return mockCreate;
  }

  // Utility to bind mocked methods and avoid unbound method warnings
  static bindMockToModel<TModel, TMethod extends keyof TModel>(
    model: TModel,
    methodName: TMethod,
    mockImplementation: unknown,
  ): void {
    const mockedModel = vi.mocked(model);
    // Use Object.defineProperty for type-safe assignment
    Object.defineProperty(mockedModel, methodName, {
      value: mockImplementation,
      writable: true,
      configurable: true,
    });
  }

  // Type-safe response creator for API tests
  static createApiResponse<TData>(
    data: TData,
    success: true,
  ): { success: true; data: TData };
  static createApiResponse<TError extends string>(
    error: TError,
    success: false,
  ): { success: false; error: TError; errors: TError[] };
  static createApiResponse<TData, TError extends string>(
    dataOrError: TData | TError,
    success: boolean,
  ): { success: true; data: TData } | { success: false; error: TError; errors: TError[] } {
    if (success) {
      return { success: true, data: dataOrError as TData };
    }
    return { 
      success: false, 
      error: dataOrError as TError, 
      errors: [dataOrError as TError],
    };
  }
}

// Type-safe mock data factories with precise types
export class MockDataFactory {
  static createMockCollection(overrides: Partial<ICollection> = {}): ICollection {
    const base = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'Mock Collection',
      description: 'Mock description',
      slug: 'mock-collection',
      owner: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      products: [] as mongoose.Types.ObjectId[],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Merge with overrides - cast is needed because ICollection extends Document
    // which has many additional properties and methods from Mongoose
    return { ...base, ...overrides } as ICollection;
  }

  static createMockProduct(overrides: Partial<IProductDocument> = {}): Partial<IProductDocument> {
    const base: Partial<IProductDocument> = {
      _id: 'mock-product-id' as IProductDocument['_id'],
      name: 'Mock Product',
      description: 'Mock description',
      price: 99.99,
      image: 'mock-image.jpg',
      isFeatured: false,
      variants: [],
    };
    return { ...base, ...overrides };
  }

  static createMockVariant(overrides: Partial<IProductVariantDocument> = {}): IProductVariantDocument {
    const base: IProductVariantDocument = {
      variantId: 'mock-variant-id',
      label: 'Mock Variant',
      price: 99.99,
      inventory: 10,
      images: [],
      attributes: {},
    };
    return { ...base, ...overrides } as IProductVariantDocument;
  }
}

// Helper to safely extract mocked function avoiding unbound method issues
export function getMockedMethod<
  T extends Record<string, unknown>,
  K extends keyof T & string,
  F extends T[K],
>(
  obj: T,
  method: K,
): F extends (...args: infer P) => infer R ? MockedFunction<(...args: P) => R> : never {
  const mocked = vi.mocked(obj);
  const mockedMethod = mocked[method as keyof typeof mocked];
  return mockedMethod as F extends (...args: infer P) => infer R
    ? MockedFunction<(...args: P) => R>
    : never;
}

// Type guard helpers for runtime type safety
export const TypeGuards = {
  isProductDocument(value: unknown): value is IProductDocument {
    return (
      value !== null &&
      typeof value === 'object' &&
      '_id' in value &&
      'name' in value &&
      'price' in value
    );
  },

  isCollection(value: unknown): value is ICollection {
    return (
      value !== null &&
      typeof value === 'object' &&
      '_id' in value &&
      'name' in value &&
      'slug' in value &&
      'owner' in value
    );
  },

  isApiSuccessResponse<T>(response: unknown): response is { success: true; data: T } {
    return (
      response !== null &&
      typeof response === 'object' &&
      'success' in response &&
      response.success === true &&
      'data' in response
    );
  },

  isApiErrorResponse(response: unknown): response is { success: false; error: string; errors: string[] } {
    return (
      response !== null &&
      typeof response === 'object' &&
      'success' in response &&
      response.success === false &&
      'error' in response
    );
  },
} as const;
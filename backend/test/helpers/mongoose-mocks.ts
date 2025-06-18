import { vi } from 'vitest';
import mongoose from 'mongoose';

export const createMockSession = (): mongoose.ClientSession => {
  const session = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
    inTransaction: () => true,
    transaction: vi.fn(),
    withTransaction: vi.fn(),
    id: 'mock-session-id',
  } as unknown as mongoose.ClientSession;
  
  return session;
};

export const createSessionableQuery = <T>(result: T | null) => {
  const mockQuery = {
    session: vi.fn().mockReturnThis(),
    then: (resolve: (value: T | null) => void) => {
      resolve(result);
      return Promise.resolve(result);
    },
    catch: vi.fn().mockReturnThis(),
    finally: vi.fn().mockReturnThis(),
  };
  
  return mockQuery;
};

export const createPopulatableQuery = <T>(result: T) => ({
  populate: vi.fn().mockReturnValue({
    populate: vi.fn().mockResolvedValue(result),
  }),
});

export const createSortableQuery = <T>(results: T[]) => ({
  sort: vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(results),
      }),
    }),
  }),
});

export const createSelectableQuery = <T>(result: T) => ({
  select: vi.fn().mockResolvedValue(result),
});

export const createChainableQuery = <T>(result: T) => ({
  select: vi.fn().mockReturnValue({
    session: vi.fn().mockResolvedValue(result),
  }),
});

export const mockObjectId = (id: string): mongoose.Types.ObjectId => ({
  toString: () => id,
  equals: (otherId: unknown) => {
    if (typeof otherId === 'string') return id === otherId;
    if (otherId && typeof otherId === 'object' && 'toString' in otherId) {
      return id === otherId.toString();
    }
    return false;
  },
  _id: id,
} as unknown as mongoose.Types.ObjectId);
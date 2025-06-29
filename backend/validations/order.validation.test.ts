import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  listOrdersSchema,
  updateOrderStatusSchema,
  bulkUpdateOrderStatusSchema,
  getOrderByIdSchema,
  getOrderStatsSchema,
  type ListOrdersInput,
  type UpdateOrderStatusInput,
  type BulkUpdateOrderStatusInput,
  type GetOrderByIdInput,
  type GetOrderStatsInput,
} from './order.validation.js';

type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

describe('Order Validation Schemas', () => {
  describe('listOrdersSchema', () => {
    it('should accept valid pagination parameters', () => {
      const input = {
        page: 1,
        limit: 20,
      };
      
      const result = listOrdersSchema.parse(input);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply default values', () => {
      const result = listOrdersSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.status).toBe('all');
      expect(result.sortBy).toBe('createdAt');
      expect(result.sortOrder).toBe('desc');
    });

    it('should accept valid search parameter', () => {
      const input = {
        search: 'user@example.com',
      };
      
      const result = listOrdersSchema.parse(input);
      expect(result.search).toBe('user@example.com');
    });

    it('should accept valid status filter', () => {
      const statuses = ['pending', 'completed', 'cancelled', 'refunded', 'all'] as const;
      
      statuses.forEach(status => {
        const result = listOrdersSchema.parse({ status });
        expect(result.status).toBe(status);
      });
    });

    it('should accept valid sorting options', () => {
      const sortByOptions = ['createdAt', 'total', 'status'] as const;
      const sortOrderOptions = ['asc', 'desc'] as const;
      
      sortByOptions.forEach(sortBy => {
        sortOrderOptions.forEach(sortOrder => {
          const result = listOrdersSchema.parse({ sortBy, sortOrder });
          expect(result.sortBy).toBe(sortBy);
          expect(result.sortOrder).toBe(sortOrder);
        });
      });
    });

    it('should accept valid date range', () => {
      const input = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-12-31T23:59:59.999Z',
      };
      
      const result = listOrdersSchema.parse(input);
      expect(result.dateFrom).toBe(input.dateFrom);
      expect(result.dateTo).toBe(input.dateTo);
    });

    it('should reject invalid page number', () => {
      expect(() => listOrdersSchema.parse({ page: 0 })).toThrow();
      expect(() => listOrdersSchema.parse({ page: -1 })).toThrow();
      expect(() => listOrdersSchema.parse({ page: 1.5 })).toThrow();
    });

    it('should reject invalid limit', () => {
      expect(() => listOrdersSchema.parse({ limit: 0 })).toThrow();
      expect(() => listOrdersSchema.parse({ limit: -1 })).toThrow();
      expect(() => listOrdersSchema.parse({ limit: 101 })).toThrow();
      expect(() => listOrdersSchema.parse({ limit: 1.5 })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => listOrdersSchema.parse({ status: 'invalid' })).toThrow();
      expect(() => listOrdersSchema.parse({ status: 'processing' })).toThrow();
    });

    it('should reject invalid sort options', () => {
      expect(() => listOrdersSchema.parse({ sortBy: 'invalid' })).toThrow();
      expect(() => listOrdersSchema.parse({ sortBy: 'user' })).toThrow();
      expect(() => listOrdersSchema.parse({ sortOrder: 'invalid' })).toThrow();
    });

    it('should reject invalid date formats', () => {
      expect(() => listOrdersSchema.parse({ dateFrom: 'invalid-date' })).toThrow();
      expect(() => listOrdersSchema.parse({ dateFrom: '2024-01-01' })).toThrow();
      expect(() => listOrdersSchema.parse({ dateTo: 'invalid-date' })).toThrow();
    });

    it('should correctly infer TypeScript types', () => {
      type TestListOrdersInput = z.infer<typeof listOrdersSchema>;
      const _test: AssertEqual<TestListOrdersInput, ListOrdersInput> = true;
      expect(_test).toBe(true);
    });
  });

  describe('updateOrderStatusSchema', () => {
    it('should accept valid order ID and status', () => {
      const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'] as const;
      
      validStatuses.forEach(status => {
        const input = {
          orderId: '507f1f77bcf86cd799439011',
          status,
        };
        
        const result = updateOrderStatusSchema.parse(input);
        expect(result.orderId).toBe(input.orderId);
        expect(result.status).toBe(status);
      });
    });

    it('should reject empty order ID', () => {
      expect(() => updateOrderStatusSchema.parse({ orderId: '', status: 'completed' })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => updateOrderStatusSchema.parse({ 
        orderId: '507f1f77bcf86cd799439011', 
        status: 'invalid', 
      })).toThrow();
    });

    it('should correctly infer TypeScript types', () => {
      type TestUpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
      const _test: AssertEqual<TestUpdateOrderStatusInput, UpdateOrderStatusInput> = true;
      expect(_test).toBe(true);
    });
  });

  describe('bulkUpdateOrderStatusSchema', () => {
    it('should accept valid array of order IDs and status', () => {
      const input = {
        orderIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        status: 'completed' as const,
      };
      
      const result = bulkUpdateOrderStatusSchema.parse(input);
      expect(result.orderIds).toEqual(input.orderIds);
      expect(result.status).toBe(input.status);
    });

    it('should reject empty array', () => {
      expect(() => bulkUpdateOrderStatusSchema.parse({ 
        orderIds: [], 
        status: 'completed', 
      })).toThrow();
    });

    it('should reject non-array orderIds', () => {
      expect(() => bulkUpdateOrderStatusSchema.parse({ 
        orderIds: '507f1f77bcf86cd799439011', 
        status: 'completed', 
      })).toThrow();
    });

    it('should reject array with empty strings', () => {
      expect(() => bulkUpdateOrderStatusSchema.parse({ 
        orderIds: ['507f1f77bcf86cd799439011', ''], 
        status: 'completed', 
      })).toThrow();
    });

    it('should reject invalid status', () => {
      expect(() => bulkUpdateOrderStatusSchema.parse({ 
        orderIds: ['507f1f77bcf86cd799439011'], 
        status: 'shipped', 
      })).toThrow();
    });

    it('should correctly infer TypeScript types', () => {
      type TestBulkUpdateOrderStatusInput = z.infer<typeof bulkUpdateOrderStatusSchema>;
      const _test: AssertEqual<TestBulkUpdateOrderStatusInput, BulkUpdateOrderStatusInput> = true;
      expect(_test).toBe(true);
    });
  });

  describe('getOrderByIdSchema', () => {
    it('should accept valid order ID', () => {
      const input = {
        orderId: '507f1f77bcf86cd799439011',
      };
      
      const result = getOrderByIdSchema.parse(input);
      expect(result.orderId).toBe(input.orderId);
    });

    it('should reject empty order ID', () => {
      expect(() => getOrderByIdSchema.parse({ orderId: '' })).toThrow();
    });

    it('should reject missing order ID', () => {
      expect(() => getOrderByIdSchema.parse({})).toThrow();
    });

    it('should correctly infer TypeScript types', () => {
      type TestGetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
      const _test: AssertEqual<TestGetOrderByIdInput, GetOrderByIdInput> = true;
      expect(_test).toBe(true);
    });
  });

  describe('getOrderStatsSchema', () => {
    it('should accept valid date range', () => {
      const input = {
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-12-31T23:59:59.999Z',
      };
      
      const result = getOrderStatsSchema.parse(input);
      expect(result.dateFrom).toBe(input.dateFrom);
      expect(result.dateTo).toBe(input.dateTo);
    });

    it('should accept empty object (all dates)', () => {
      const result = getOrderStatsSchema.parse({});
      expect(result.dateFrom).toBeUndefined();
      expect(result.dateTo).toBeUndefined();
    });

    it('should accept only dateFrom', () => {
      const input = {
        dateFrom: '2024-01-01T00:00:00.000Z',
      };
      
      const result = getOrderStatsSchema.parse(input);
      expect(result.dateFrom).toBe(input.dateFrom);
      expect(result.dateTo).toBeUndefined();
    });

    it('should accept only dateTo', () => {
      const input = {
        dateTo: '2024-12-31T23:59:59.999Z',
      };
      
      const result = getOrderStatsSchema.parse(input);
      expect(result.dateFrom).toBeUndefined();
      expect(result.dateTo).toBe(input.dateTo);
    });

    it('should reject invalid date formats', () => {
      expect(() => getOrderStatsSchema.parse({ dateFrom: 'invalid-date' })).toThrow();
      expect(() => getOrderStatsSchema.parse({ dateFrom: '2024-01-01' })).toThrow();
      expect(() => getOrderStatsSchema.parse({ dateTo: 'invalid-date' })).toThrow();
    });

    it('should correctly infer TypeScript types', () => {
      type TestGetOrderStatsInput = z.infer<typeof getOrderStatsSchema>;
      const _test: AssertEqual<TestGetOrderStatsInput, GetOrderStatsInput> = true;
      expect(_test).toBe(true);
    });
  });
});
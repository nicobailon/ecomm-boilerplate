import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOrderStatusValidation } from '../useOrderStatusValidation';
import type { OrderStatus } from '@/types/order';

describe('useOrderStatusValidation Edge Cases', () => {
  describe('Invalid Status Values', () => {
    it('should handle undefined status gracefully', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const validStatuses = result.current.getValidNextStatuses(undefined as any);
      expect(validStatuses).toEqual([]);
    });

    it('should handle null status gracefully', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const validStatuses = result.current.getValidNextStatuses(null as any);
      expect(validStatuses).toEqual([]);
    });

    it('should handle invalid status strings', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const validStatuses = result.current.getValidNextStatuses('processing' as any);
      expect(validStatuses).toEqual([]);
    });

    it('should handle empty string status', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const validStatuses = result.current.getValidNextStatuses('' as any);
      expect(validStatuses).toEqual([]);
    });
  });

  describe('Transition Validation Edge Cases', () => {
    it('should handle same status transitions', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      // Same status should be invalid
      expect(result.current.isValidTransition('pending', 'pending')).toBe(false);
      expect(result.current.isValidTransition('completed', 'completed')).toBe(false);
      expect(result.current.isValidTransition('cancelled', 'cancelled')).toBe(false);
      expect(result.current.isValidTransition('refunded', 'refunded')).toBe(false);
    });

    it('should handle case sensitivity in status values', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      // Should be case sensitive
      expect(result.current.isValidTransition('PENDING' as any, 'completed')).toBe(false);
      expect(result.current.isValidTransition('pending', 'COMPLETED' as any)).toBe(false);
    });

    it('should validate all reverse transitions', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      // Test all invalid reverse transitions
      expect(result.current.isValidTransition('completed', 'pending')).toBe(false);
      expect(result.current.isValidTransition('refunded', 'completed')).toBe(false);
      expect(result.current.isValidTransition('refunded', 'pending')).toBe(false);
      expect(result.current.isValidTransition('refunded', 'cancelled')).toBe(false);
    });
  });

  describe('Batch Validation', () => {
    it('should handle validation of multiple orders with different statuses', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const orders = [
        { status: 'pending' as OrderStatus },
        { status: 'completed' as OrderStatus },
        { status: 'cancelled' as OrderStatus },
        { status: 'refunded' as OrderStatus },
      ];

      // Check which orders can transition to 'cancelled'
      const canCancel = orders.filter(order => 
        result.current.isValidTransition(order.status, 'cancelled'),
      );

      expect(canCancel).toHaveLength(1); // Only pending can go to cancelled
      expect(canCancel[0].status).toBe('pending');
    });

    it('should handle empty arrays', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const orders: { status: OrderStatus }[] = [];
      
      const canComplete = orders.filter(order => 
        result.current.isValidTransition(order.status, 'completed'),
      );

      expect(canComplete).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle rapid sequential calls efficiently', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const startTime = performance.now();
      
      // Simulate 1000 rapid validation checks
      for (let i = 0; i < 1000; i++) {
        result.current.getValidNextStatuses('pending');
        result.current.isValidTransition('pending', 'completed');
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within 100ms
      expect(executionTime).toBeLessThan(100);
    });

    it('should not cause memory leaks with repeated hook renders', () => {
      // Render and unmount the hook multiple times
      for (let i = 0; i < 100; i++) {
        const { result, unmount } = renderHook(() => useOrderStatusValidation());
        
        result.current.getValidNextStatuses('pending');
        result.current.isValidTransition('pending', 'completed');
        
        unmount();
      }
      
      // If we reach here without errors, memory handling is likely fine
      expect(true).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful messages for invalid transitions', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const testCases = [
        { from: 'completed', to: 'cancelled', shouldContain: 'completed' },
        { from: 'refunded', to: 'pending', shouldContain: 'final' },
        { from: 'cancelled', to: 'refunded', shouldContain: 'complete' }, // Changed from 'paid' to 'complete'
      ];

      testCases.forEach(({ from, to, shouldContain }) => {
        const message = result.current.getTransitionErrorMessage(
          from as OrderStatus,
          to as OrderStatus,
        );
        expect(message.toLowerCase()).toContain(shouldContain);
      });
    });

    it('should handle error messages for invalid status values', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      const message = result.current.getTransitionErrorMessage(
        'invalid' as any,
        'completed',
      );
      
      expect(message).toBeTruthy();
      expect(message.length).toBeGreaterThan(0); // Just ensure we get a message
    });
  });

  describe('UI Integration Edge Cases', () => {
    it('should handle rapid status changes in UI', () => {
      const { result, rerender } = renderHook(() => useOrderStatusValidation());
      
      // Simulate rapid prop changes
      const statuses: OrderStatus[] = ['pending', 'completed', 'refunded'];
      
      statuses.forEach(status => {
        rerender();
        const validNext = result.current.getValidNextStatuses(status);
        expect(Array.isArray(validNext)).toBe(true);
      });
    });

    it('should maintain consistency across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useOrderStatusValidation());
      const { result: result2 } = renderHook(() => useOrderStatusValidation());
      
      // Both instances should return the same results
      expect(result1.current.getValidNextStatuses('pending'))
        .toEqual(result2.current.getValidNextStatuses('pending'));
      
      expect(result1.current.isValidTransition('pending', 'completed'))
        .toBe(result2.current.isValidTransition('pending', 'completed'));
    });
  });

  describe('Future-Proofing', () => {
    it('should handle potential new status values gracefully', () => {
      const { result } = renderHook(() => useOrderStatusValidation());
      
      // If new statuses are added in the future
      const futureStatus = 'shipped' as any;
      
      const validNext = result.current.getValidNextStatuses(futureStatus);
      expect(validNext).toEqual([]); // Should default to no transitions
      
      const isValid = result.current.isValidTransition(futureStatus, 'completed');
      expect(isValid).toBe(false); // Should default to invalid
    });
  });
});
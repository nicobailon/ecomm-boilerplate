import { describe, it, expect } from 'vitest';
import { OrderStatusValidator, type StatusTransition } from './order-status-validator.js';

describe('OrderStatusValidator', () => {
  describe('isValidTransition', () => {
    it('should return true for valid transitions from pending', () => {
      expect(OrderStatusValidator.isValidTransition('pending', 'completed')).toBe(true);
      expect(OrderStatusValidator.isValidTransition('pending', 'cancelled')).toBe(true);
    });

    it('should return true for valid transitions from completed', () => {
      expect(OrderStatusValidator.isValidTransition('completed', 'refunded')).toBe(true);
    });

    it('should return true for valid transitions from cancelled', () => {
      expect(OrderStatusValidator.isValidTransition('cancelled', 'pending')).toBe(true);
    });

    it('should return false for invalid transitions from pending', () => {
      expect(OrderStatusValidator.isValidTransition('pending', 'refunded')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('pending', 'pending')).toBe(false);
    });

    it('should return false for invalid transitions from completed', () => {
      expect(OrderStatusValidator.isValidTransition('completed', 'cancelled')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('completed', 'pending')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('completed', 'completed')).toBe(false);
    });

    it('should return false for invalid transitions from cancelled', () => {
      expect(OrderStatusValidator.isValidTransition('cancelled', 'completed')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('cancelled', 'refunded')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('cancelled', 'cancelled')).toBe(false);
    });

    it('should return false for any transitions from refunded', () => {
      expect(OrderStatusValidator.isValidTransition('refunded', 'pending')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('refunded', 'completed')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('refunded', 'cancelled')).toBe(false);
      expect(OrderStatusValidator.isValidTransition('refunded', 'refunded')).toBe(false);
    });
  });

  describe('validateTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => OrderStatusValidator.validateTransition({ from: 'pending', to: 'completed' })).not.toThrow();
      expect(() => OrderStatusValidator.validateTransition({ from: 'pending', to: 'cancelled' })).not.toThrow();
      expect(() => OrderStatusValidator.validateTransition({ from: 'completed', to: 'refunded' })).not.toThrow();
      expect(() => OrderStatusValidator.validateTransition({ from: 'cancelled', to: 'pending' })).not.toThrow();
    });

    it('should throw for invalid transitions', () => {
      expect(() => OrderStatusValidator.validateTransition({ from: 'completed', to: 'cancelled' })).toThrow();
      expect(() => OrderStatusValidator.validateTransition({ from: 'refunded', to: 'completed' })).toThrow();
      expect(() => OrderStatusValidator.validateTransition({ from: 'cancelled', to: 'refunded' })).toThrow();
    });

    it('should include metadata in transition validation', () => {
      const transition: StatusTransition = {
        from: 'pending',
        to: 'completed',
        userId: 'user123',
        reason: 'Payment processed',
      };
      expect(() => OrderStatusValidator.validateTransition(transition)).not.toThrow();
    });
  });

  describe('getValidNextStatuses', () => {
    it('should return valid next statuses for pending', () => {
      const validStatuses = OrderStatusValidator.getValidNextStatuses('pending');
      expect(validStatuses).toEqual(['completed', 'cancelled']);
    });

    it('should return valid next statuses for completed', () => {
      const validStatuses = OrderStatusValidator.getValidNextStatuses('completed');
      expect(validStatuses).toEqual(['refunded']);
    });

    it('should return valid next statuses for cancelled', () => {
      const validStatuses = OrderStatusValidator.getValidNextStatuses('cancelled');
      expect(validStatuses).toEqual(['pending']);
    });

    it('should return empty array for refunded', () => {
      const validStatuses = OrderStatusValidator.getValidNextStatuses('refunded');
      expect(validStatuses).toEqual([]);
    });
  });

  describe('getTransitionErrorMessage', () => {
    it('should return specific error for completed to cancelled', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('completed', 'cancelled');
      expect(error).toBe('Cannot cancel an order that has already been completed');
    });

    it('should return specific error for refunded to completed', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('refunded', 'completed');
      expect(error).toBe('Cannot mark a refunded order as completed');
    });

    it('should return specific error for refunded to cancelled', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('refunded', 'cancelled');
      expect(error).toBe('Cannot cancel an order that has already been refunded');
    });

    it('should return specific error for cancelled to refunded', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('cancelled', 'refunded');
      expect(error).toBe('Cannot refund an order that was never completed');
    });

    it('should return specific error for cancelled to completed', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('cancelled', 'completed');
      expect(error).toBe('A cancelled order must be reactivated to pending status first');
    });

    it('should return specific error for pending to refunded', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('pending', 'refunded');
      expect(error).toBe('Can only refund completed orders');
    });

    it('should return final status error for refunded', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('refunded', 'pending');
      expect(error).toBe('Order status \'refunded\' is final and cannot be changed');
    });

    it('should return generic error with valid transitions for unhandled cases', () => {
      const error = OrderStatusValidator.getTransitionErrorMessage('pending', 'pending');
      expect(error).toBe('Invalid status transition from \'pending\' to \'pending\'. Valid transitions: completed, cancelled');
    });
  });

  describe('validateBulkTransitions', () => {
    it('should categorize all valid transitions correctly', () => {
      const transitions: StatusTransition[] = [
        { from: 'pending', to: 'completed' },
        { from: 'pending', to: 'cancelled' },
        { from: 'completed', to: 'refunded' },
      ];

      const result = OrderStatusValidator.validateBulkTransitions(transitions);
      expect(result.valid).toHaveLength(3);
      expect(result.invalid).toHaveLength(0);
    });

    it('should categorize all invalid transitions correctly', () => {
      const transitions: StatusTransition[] = [
        { from: 'completed', to: 'cancelled' },
        { from: 'refunded', to: 'completed' },
        { from: 'cancelled', to: 'refunded' },
      ];

      const result = OrderStatusValidator.validateBulkTransitions(transitions);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(3);
    });

    it('should handle mixed valid and invalid transitions', () => {
      const transitions: StatusTransition[] = [
        { from: 'pending', to: 'completed' },
        { from: 'completed', to: 'cancelled' },
        { from: 'cancelled', to: 'pending' },
        { from: 'refunded', to: 'completed' },
      ];

      const result = OrderStatusValidator.validateBulkTransitions(transitions);
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(2);
      
      expect(result.valid[0]).toEqual({ from: 'pending', to: 'completed' });
      expect(result.valid[1]).toEqual({ from: 'cancelled', to: 'pending' });
    });

    it('should include error messages for invalid transitions', () => {
      const transitions: StatusTransition[] = [
        { from: 'completed', to: 'cancelled' },
        { from: 'refunded', to: 'completed' },
      ];

      const result = OrderStatusValidator.validateBulkTransitions(transitions);
      
      expect(result.invalid[0].error).toBe('Cannot cancel an order that has already been completed');
      expect(result.invalid[1].error).toBe('Cannot mark a refunded order as completed');
    });

    it('should preserve metadata in validated transitions', () => {
      const transitions: StatusTransition[] = [
        { from: 'pending', to: 'completed', userId: 'user1', reason: 'Payment processed' },
        { from: 'completed', to: 'cancelled', userId: 'user2', reason: 'Invalid attempt' },
      ];

      const result = OrderStatusValidator.validateBulkTransitions(transitions);
      
      expect(result.valid[0]).toEqual({
        from: 'pending',
        to: 'completed',
        userId: 'user1',
        reason: 'Payment processed',
      });
      
      expect(result.invalid[0]).toMatchObject({
        from: 'completed',
        to: 'cancelled',
        userId: 'user2',
        reason: 'Invalid attempt',
      });
    });

    it('should handle empty array', () => {
      const result = OrderStatusValidator.validateBulkTransitions([]);
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(0);
    });
  });
});
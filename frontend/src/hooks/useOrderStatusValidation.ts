import { OrderStatus } from '../types/order';

export const useOrderStatusValidation = () => {
  const getValidNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['completed', 'cancelled'],
      completed: ['refunded'],
      cancelled: ['pending'],
      refunded: [],
      pending_inventory: ['completed', 'cancelled']
    };
    return validTransitions[currentStatus] || [];
  };

  const isValidTransition = (from: OrderStatus, to: OrderStatus): boolean => {
    return getValidNextStatuses(from).includes(to);
  };

  const getTransitionErrorMessage = (from: OrderStatus, to: OrderStatus): string => {
    const businessRules: Record<string, string> = {
      'completed-cancelled': 'Cannot cancel an order that has already been completed',
      'refunded-completed': 'Cannot mark a refunded order as completed',
      'refunded-cancelled': 'Cannot cancel an order that has already been refunded',
      'cancelled-refunded': 'Cannot refund an order that was never completed',
      'cancelled-completed': 'A cancelled order must be reactivated to pending status first',
      'pending-refunded': 'Can only refund completed orders'
    };
    
    const transitionKey = `${from}-${to}`;
    const businessRule = businessRules[transitionKey];
    
    if (businessRule) {
      return businessRule;
    }
    
    const validStatuses = getValidNextStatuses(from);
    
    if (validStatuses.length === 0) {
      return `Order status '${from}' is final and cannot be changed`;
    }
    
    return `Invalid status transition from '${from}' to '${to}'. Valid transitions: ${validStatuses.join(', ')}`;
  };

  const validateBulkTransitions = (
    orders: Array<{ status: OrderStatus }>, 
    targetStatus: OrderStatus
  ): {
    valid: number[];
    invalid: Array<{ index: number; error: string }>;
  } => {
    const valid: number[] = [];
    const invalid: Array<{ index: number; error: string }> = [];
    
    orders.forEach((order, index) => {
      if (isValidTransition(order.status, targetStatus)) {
        valid.push(index);
      } else {
        invalid.push({
          index,
          error: getTransitionErrorMessage(order.status, targetStatus)
        });
      }
    });
    
    return { valid, invalid };
  };

  return { 
    getValidNextStatuses, 
    isValidTransition, 
    getTransitionErrorMessage,
    validateBulkTransitions
  };
};
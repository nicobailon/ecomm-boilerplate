import { AppError } from './AppError.js';

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';

export interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  reason?: string;
  userId?: string;
}

export interface StatusChangeEntry {
  from: OrderStatus;
  to: OrderStatus;
  timestamp: Date;
  userId?: string;
  reason?: string;
}

export class OrderStatusValidator {
  private static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['completed', 'cancelled'],
    pending_inventory: ['completed', 'cancelled'],
    completed: ['refunded'],
    cancelled: ['pending'],
    refunded: [],
  };

  static isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validNextStatuses = this.VALID_TRANSITIONS[from] || [];
    return validNextStatuses.includes(to);
  }

  static validateTransition(transition: StatusTransition): void {
    const { from, to } = transition;
    
    if (!this.isValidTransition(from, to)) {
      throw new AppError(this.getTransitionErrorMessage(from, to), 400);
    }
  }

  static getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  static getTransitionErrorMessage(from: OrderStatus, to: OrderStatus): string {
    const businessRules: Record<string, string> = {
      'completed-cancelled': 'Cannot cancel an order that has already been completed',
      'refunded-completed': 'Cannot mark a refunded order as completed',
      'refunded-cancelled': 'Cannot cancel an order that has already been refunded',
      'cancelled-refunded': 'Cannot refund an order that was never completed',
      'cancelled-completed': 'A cancelled order must be reactivated to pending status first',
      'pending-refunded': 'Can only refund completed orders',
    };
    
    const transitionKey = `${from}-${to}`;
    const businessRule = businessRules[transitionKey];
    
    if (businessRule) {
      return businessRule;
    }
    
    const validStatuses = this.getValidNextStatuses(from);
    
    if (validStatuses.length === 0) {
      return `Order status '${from}' is final and cannot be changed`;
    }
    
    return `Invalid status transition from '${from}' to '${to}'. Valid transitions: ${validStatuses.join(', ')}`;
  }

  static validateBulkTransitions(transitions: StatusTransition[]): {
    valid: StatusTransition[];
    invalid: (StatusTransition & { error: string })[];
  } {
    const valid: StatusTransition[] = [];
    const invalid: (StatusTransition & { error: string })[] = [];
    
    transitions.forEach(transition => {
      if (this.isValidTransition(transition.from, transition.to)) {
        valid.push(transition);
      } else {
        invalid.push({
          ...transition,
          error: this.getTransitionErrorMessage(transition.from, transition.to),
        });
      }
    });
    
    return { valid, invalid };
  }
}
import { EventEmitter } from 'events';

export interface ProductEvents {
  'product:created': { productId: string; timestamp: number };
  'product:updated': { productId: string; changes: any };
  'product:deleted': { productId: string };
}

class ProductEventEmitter extends EventEmitter {
  emit<K extends keyof ProductEvents>(
    event: K,
    data: ProductEvents[K]
  ): boolean {
    return super.emit(event, data);
  }
  
  on<K extends keyof ProductEvents>(
    event: K,
    listener: (data: ProductEvents[K]) => void
  ): this {
    return super.on(event, listener);
  }
  
  off<K extends keyof ProductEvents>(
    event: K,
    listener: (data: ProductEvents[K]) => void
  ): this {
    return super.off(event, listener);
  }
}

export const productEvents = new ProductEventEmitter();
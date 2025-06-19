export interface ProductEvents extends Record<string, unknown> {
  'product:created': { productId: string; timestamp: number };
  'product:updated': { productId: string; changes: Record<string, unknown> };
  'product:deleted': { productId: string };
}

type EventCallback<T = unknown> = (data: T) => void;

class BrowserEventEmitter<Events extends Record<string, unknown>> {
  private events = new Map<keyof Events, Set<EventCallback<unknown>>>();

  emit<K extends keyof Events>(event: K, data: Events[K]): boolean {
    const callbacks = this.events.get(event);
    if (!callbacks || callbacks.size === 0) return false;
    
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
    
    return true;
  }
  
  on<K extends keyof Events>(
    event: K,
    listener: EventCallback<Events[K]>,
  ): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    const eventSet = this.events.get(event);
    if (eventSet) {
      eventSet.add(listener as EventCallback<unknown>);
    }
    return this;
  }
  
  off<K extends keyof Events>(
    event: K,
    listener: EventCallback<Events[K]>,
  ): this {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(listener as EventCallback<unknown>);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }
  
  removeAllListeners(event?: keyof Events): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

export const productEvents = new BrowserEventEmitter<ProductEvents>();
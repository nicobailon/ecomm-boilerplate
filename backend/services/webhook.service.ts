import mongoose from 'mongoose';
import Stripe from 'stripe';
import { WebhookEvent } from '../models/webhook-event.model.js';
import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import { inventoryService } from './inventory.service.js';
import { CheckoutProduct as InventoryCheckoutProduct } from '../types/inventory.types.js';
import { 
  WebhookError, 
  WebhookEventType, 
  WebhookProcessingResult 
} from '../types/webhook.types.js';
import { stripe } from '../lib/stripe.js';
import { queueEmail } from '../lib/email-queue.js';
import { webhookMonitoring } from '../lib/webhook-monitoring.js';
import { defaultLogger as logger } from '../utils/logger.js';
import { InventoryError } from '../utils/AppError.js';
import type { IPopulatedOrderDocument } from './email.service.js';

export class WebhookService {
  private readonly logger = logger.child({ service: 'WebhookService' });

  async processWebhookEvent(
    event: Stripe.Event,
    raw?: string
  ): Promise<WebhookProcessingResult> {
    // Record the event
    await this.recordWebhookEvent(event, raw);

    // Check if already processed
    if (await this.isEventProcessed(event.id)) {
      this.logger.info('webhook.event.already.processed', { eventId: event.id });
      return {
        success: false,
        message: 'Event already processed',
      };
    }

    // Monitor webhook event
    const startTime = Date.now();

    try {
      let result: WebhookProcessingResult;

      switch (event.type) {
        case 'checkout.session.completed':
          result = await this.handleCheckoutCompleted(event);
          break;
        case 'payment_intent.succeeded':
          result = await this.handlePaymentSucceeded(event);
          break;
        case 'payment_intent.payment_failed':
          result = await this.handlePaymentFailed(event);
          break;
        default:
          this.logger.warn('webhook.event.type.unhandled', { type: event.type });
          result = {
            success: true,
            message: `Unhandled event type: ${event.type}`,
          };
      }

      // Mark as processed
      if (result.success && result.orderId) {
        await this.markEventProcessed(event.id, result.orderId);
      }

      await webhookMonitoring.logWebhookEvent(
        event.id,
        event.type,
        true,
        Date.now() - startTime
      );
      return result;
    } catch (error) {
      await webhookMonitoring.logWebhookEvent(
        event.id,
        event.type,
        false,
        Date.now() - startTime,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      // Record failure
      await this.recordEventFailure(event.id, error);

      if (error instanceof WebhookError) {
        throw error;
      }

      throw new WebhookError(
        error instanceof Error ? error.message : 'Webhook processing failed',
        'PROCESSING_ERROR',
        500,
        true
      );
    }
  }

  private async handleCheckoutCompleted(
    event: Stripe.Event
  ): Promise<WebhookProcessingResult> {
    const session = event.data.object as Stripe.Checkout.Session;
    
    if (session.payment_status !== 'paid') {
      return {
        success: true,
        message: 'Session not paid yet',
      };
    }

    this.logger.info('webhook.checkout.session.processing', {
      sessionId: session.id,
      eventId: event.id,
    });

    // Process the order creation
    const result = await this.createOrderFromSession(
      session.id,
      session.payment_intent as string,
      event.id
    );

    return result;
  }

  private async handlePaymentSucceeded(
    event: Stripe.Event
  ): Promise<WebhookProcessingResult> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    this.logger.info('webhook.payment.intent.succeeded', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
    });

    // Check if we have a checkout session ID in metadata
    if (paymentIntent.metadata?.checkoutSessionId) {
      // Check if order already exists for this payment intent
      const existingOrder = await Order.findOne({ 
        paymentIntentId: paymentIntent.id 
      });
      
      if (existingOrder) {
        return {
          success: true,
          message: 'Payment intent succeeded',
          orderId: String(existingOrder._id),
        };
      }
      
      // Create order from the checkout session
      const result = await this.createOrderFromSession(
        paymentIntent.metadata.checkoutSessionId,
        paymentIntent.id,
        event.id
      );
      
      return result;
    }

    return {
      success: true,
      message: 'Payment intent succeeded',
    };
  }

  private async handlePaymentFailed(
    event: Stripe.Event
  ): Promise<WebhookProcessingResult> {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    this.logger.warn('webhook.payment.intent.failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error,
    });
    
    // Send failure notification email if we have user metadata
    if (paymentIntent.metadata?.userId) {
      try {
        const user = await User.findById(paymentIntent.metadata.userId);
        if (user) {
          // TODO: Add paymentFailed email type
          // await queueEmail('paymentFailed', {
          //   user,
          //   error: paymentIntent.last_payment_error?.message || 'Payment failed',
          // });
        }
      } catch (emailError) {
        this.logger.error('webhook.payment.failed.email.error', emailError);
      }
    }

    return {
      success: true,
      error: 'Payment failed',
    };
  }

  private async recordWebhookEvent(
    event: Stripe.Event,
    raw?: string
  ): Promise<void> {
    try {
      await WebhookEvent.findOneAndUpdate(
        { stripeEventId: event.id },
        {
          stripeEventId: event.id,
          type: event.type as WebhookEventType,
          eventType: event.type, // Set eventType to match type for monitoring consistency
          data: event.data.object,
          rawBody: raw,
          receivedAt: new Date(),
        },
        { upsert: true }
      );
    } catch (error) {
      this.logger.error('webhook.event.record.error', error, {
        eventId: event.id,
      });
    }
  }

  private async recordEventFailure(
    eventId: string,
    error: unknown
  ): Promise<void> {
    try {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await WebhookEvent.findOneAndUpdate(
        { stripeEventId: eventId },
        {
          $inc: { retryCount: 1, attempts: 1 },
          $set: {
            error: errorMessage,
            lastError: errorMessage,
            lastAttemptAt: new Date(),
          },
          $setOnInsert: {
            stripeEventId: eventId,
            type: 'unknown',
            eventType: 'unknown', // Set eventType for monitoring consistency
            processed: false,
            receivedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (recordError) {
      this.logger.error('webhook.event.failure.record.error', recordError, {
        eventId,
      });
    }
  }

  async createOrderFromSession(
    sessionId: string,
    paymentIntentId: string,
    eventId?: string
  ): Promise<WebhookProcessingResult> {
    // First check for existing order OUTSIDE of transaction to prevent duplicates
    const existingOrder = await Order.findOne({ 
      stripeSessionId: sessionId 
    });
    
    if (existingOrder) {
      this.logger.info('webhook.order.already-exists', {
        sessionId,
        orderId: existingOrder._id,
        eventId,
      });
      
      // Mark event as processed
      if (eventId) {
        await this.markEventProcessed(eventId, String(existingOrder._id));
      }
      
      return {
        success: true,
        orderId: String(existingOrder._id),
      };
    }

    const dbSession = await mongoose.startSession();
    
    try {
      let orderId: string | undefined;
      let orderStatus: 'completed' | 'pending_inventory' = 'completed';
      let inventoryIssues: string[] | undefined;
      
      await dbSession.withTransaction(async () => {
        // Double-check inside transaction for race conditions
        const existingOrderInTx = await Order.findOne({ 
          stripeSessionId: sessionId 
        }).session(dbSession);
        
        if (existingOrderInTx) {
          orderId = String(existingOrderInTx._id);
          return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items', 'customer_details', 'shipping_details'],
        });

        if (!session) {
          throw new WebhookError(
            'Session not found',
            'SESSION_NOT_FOUND',
            400,
            false
          );
        }

        if (!session.metadata?.userId || !session.metadata?.products) {
          throw new WebhookError(
            'Missing required metadata in checkout session',
            'INVALID_SESSION_METADATA',
            400,
            false
          );
        }

        const user = await User.findById(session.metadata.userId).session(dbSession);
        if (!user) {
          throw new WebhookError(
            'User not found',
            'USER_NOT_FOUND',
            404,
            false
          );
        }

        const products = JSON.parse(session.metadata.products) as Array<{
          id: string;
          quantity: number;
          price: number;
          variantId?: string;
          variantDetails?: {
            size?: string;
            color?: string;
            sku?: string;
          };
          variantLabel?: string;
        }>;

        // Step 1: Validate inventory atomically BEFORE creating order
        this.logger.info('webhook.inventory.validation.start', {
          sessionId,
          productCount: products.length,
          eventId,
        });

        const inventoryProducts: InventoryCheckoutProduct[] = products.map(p => ({
          id: p.id,
          quantity: p.quantity,
          variantId: p.variantId,
          variantLabel: p.variantLabel,
        }));

        const inventoryValidation = await inventoryService.validateAndReserveInventory(
          inventoryProducts,
          dbSession
        );

        if (!inventoryValidation.isValid) {
          // Log the issue but continue with order creation
          this.logger.warn('webhook.inventory.validation.failed', {
            sessionId,
            errors: inventoryValidation.errors,
            eventId,
          });
          
          // Create order with special status for manual review
          orderStatus = 'pending_inventory';
          inventoryIssues = inventoryValidation.errors;
        }

        this.logger.info('webhook.inventory.validation.success', {
          sessionId,
          validatedCount: inventoryValidation.validatedProducts.length,
          eventId,
        });

        const orderNumber = await this.generateOrderNumber();
        const subtotal = (session.amount_subtotal ?? session.amount_total ?? 0) / 100;
        const tax = ((session.total_details?.amount_tax ?? 0) / 100);
        const shipping = ((session.total_details?.amount_shipping ?? 0) / 100);
        const discount = ((session.total_details?.amount_discount ?? 0) / 100);
        
        const newOrder = new Order({
          orderNumber,
          user: session.metadata.userId,
          email: user.email,
          products: products.map(product => ({
            product: product.id,
            quantity: product.quantity,
            price: product.price,
            variantId: product.variantId,
            variantDetails: product.variantDetails,
            variantLabel: product.variantLabel,
          })),
          totalAmount: (session.amount_total ?? 0) / 100,
          subtotal,
          tax,
          shipping,
          discount,
          stripeSessionId: sessionId,
          paymentIntentId: paymentIntentId ?? (session.payment_intent as string),
          shippingAddress: session.shipping_details?.address ? {
            fullName: session.shipping_details?.name ?? user.name ?? 'Customer',
            line1: session.shipping_details.address.line1 ?? '',
            line2: session.shipping_details.address.line2 ?? undefined,
            city: session.shipping_details.address.city ?? '',
            state: session.shipping_details.address.state ?? '',
            postalCode: session.shipping_details.address.postal_code ?? '',
            country: session.shipping_details.address.country ?? 'US',
            phone: session.customer_details?.phone ?? undefined,
          } : undefined,
          billingAddress: session.customer_details?.address ? {
            fullName: session.customer_details?.name ?? user.name ?? 'Customer',
            line1: session.customer_details.address.line1 ?? '',
            line2: session.customer_details.address.line2 ?? undefined,
            city: session.customer_details.address.city ?? '',
            state: session.customer_details.address.state ?? '',
            postalCode: session.customer_details.address.postal_code ?? '',
            country: session.customer_details.address.country ?? 'US',
          } : undefined,
          paymentMethod: 'card',
          couponCode: session.metadata?.couponCode ?? undefined,
          originalAmount: session.metadata?.couponCode 
            ? (session.amount_subtotal ?? session.amount_total ?? 0) / 100
            : undefined,
          webhookEventId: eventId,
          status: orderStatus,
          inventoryIssues: inventoryIssues,
          statusHistory: [{
            from: 'pending',
            to: orderStatus,
            timestamp: new Date(),
            userId: session.metadata.userId ? new mongoose.Types.ObjectId(session.metadata.userId) : undefined,
            reason: orderStatus === 'pending_inventory' 
              ? 'Payment processed via webhook with inventory issues' 
              : 'Payment processed via webhook',
          }],
        });

        await newOrder.save({ session: dbSession });
        orderId = String(newOrder._id);

        // Step 2: Deduct inventory atomically (only if inventory validation passed)
        if (orderStatus !== 'pending_inventory') {
          for (const product of products) {
            try {
              // Use atomic deduction
              await inventoryService.atomicInventoryDeduction(
                product.id,
                product.variantId,
                product.quantity,
                dbSession
              );

              // Record inventory history
              await inventoryService.updateInventory(
                product.id,
                product.variantId,
                -product.quantity,
                'sale',
                session.metadata.userId,
                { orderId, skipDeduction: true, webhookEventId: eventId },
              );
            } catch (error) {
              this.logger.error('webhook.inventory.deduction.error', error, {
                sessionId,
                productId: product.id,
                variantId: product.variantId,
                quantity: product.quantity,
                eventId,
              });
              
              // This should rarely happen due to validation, but if it does, throw error
              if (error instanceof InventoryError) {
                throw new WebhookError(
                  error.message,
                  'INVENTORY_DEDUCTION_FAILED',
                  500,
                  true // Retry
                );
              }
              throw error;
            }
          }
        }

        if (user) {
          user.cartItems = [];
          user.appliedCoupon = null;
          await user.save({ session: dbSession });
        }

        // Get populated order for email
        const populatedOrder = await Order.findById(orderId)
          .populate('products.product', 'name image price')
          .session(dbSession)
          .lean() as IPopulatedOrderDocument | null;

        // Queue email (non-critical, so we don't await)
        if (user && populatedOrder) {
          queueEmail('orderConfirmation', {
            order: populatedOrder,
            user,
          }).catch(emailError => {
            console.error('Failed to send order confirmation email:', emailError);
          });
        }
      });

      // Log final result
      if (inventoryIssues && inventoryIssues.length > 0) {
        this.logger.warn('webhook.order.created.with.inventory.issues', {
          orderId,
          sessionId,
          inventoryIssues,
          eventId,
        });
      } else {
        this.logger.info('webhook.order.created.successfully', {
          orderId,
          sessionId,
          eventId,
        });
      }

      return {
        success: true,
        orderId,
      };
    } catch (error) {
      // Don't call abortTransaction here - withTransaction handles it
      
      // Handle duplicate key error specifically
      if (error instanceof Error && error.message.includes('duplicate key')) {
        this.logger.info('webhook.order.duplicate.key.error', {
          sessionId,
          eventId,
          error: error.message,
        });
        
        // Try to find the existing order
        const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
        if (existingOrder) {
          if (eventId) {
            await this.markEventProcessed(eventId, String(existingOrder._id));
          }
          
          return {
            success: true,
            orderId: String(existingOrder._id),
            message: 'Order already exists',
          };
        }
      }
      
      throw error;
    } finally {
      await dbSession.endSession();
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const event = await WebhookEvent.findOne({ stripeEventId: eventId });
    return event?.processed ?? false;
  }

  private async markEventProcessed(
    eventId: string,
    orderId?: string
  ): Promise<void> {
    await WebhookEvent.findOneAndUpdate(
      { stripeEventId: eventId },
      {
        processed: true,
        processedAt: new Date(),
        orderId,
      }
    );
  }

  async retryFailedEvents(
    maxAttempts: number = 3,
    olderThan: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
  ): Promise<{ processed: number; failed: number }> {
    const failedEvents = await WebhookEvent.find({
      processed: false,
      retryCount: { $lt: maxAttempts },
      createdAt: { $lt: olderThan },
    })
      .sort({ createdAt: 1 })
      .limit(100);

    let processed = 0;
    let failed = 0;

    for (const webhookEvent of failedEvents) {
      try {
        const stripeEvent = await stripe.events.retrieve(webhookEvent.stripeEventId);
        await this.processWebhookEvent(stripeEvent);
        processed++;
      } catch (error) {
        failed++;
        this.logger.error('webhook.retry.failed', error, {
          eventId: webhookEvent.stripeEventId,
        });
      }
    }

    return { processed, failed };
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const orderCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequenceNumber = String(orderCount + 1).padStart(4, '0');
    return `ORD-${year}${month}${day}-${sequenceNumber}`;
  }

  // Additional methods for exponential backoff
  private calculateBackoffDelay(attempts: number, baseDelay: number = 1000): number {
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  async scheduleRetry(
    eventId: string,
    _error: WebhookError
  ): Promise<void> {
    const event = await WebhookEvent.findOne({ stripeEventId: eventId });
    if (!event) return;

    const delay = this.calculateBackoffDelay(event.retryCount ?? 0);
    
    // In a real implementation, you'd use a job queue like Bull or BullMQ
    setTimeout(async () => {
      try {
        const stripeEvent = await stripe.events.retrieve(eventId);
        await this.processWebhookEvent(stripeEvent);
      } catch (retryError) {
        this.logger.error('webhook.scheduled.retry.failed', retryError, {
          eventId,
          attempts: event.retryCount,
        });
      }
    }, delay);
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
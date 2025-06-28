import mongoose from 'mongoose';
import { stripe } from '../lib/stripe.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { AppError, InventoryError, NotFoundError, ValidationError, PaymentError, AuthorizationError } from '../utils/AppError.js';
import { IUserDocument } from '../models/user.model.js';
import { couponService } from './coupon.service.js';
import { inventoryService } from './inventory.service.js';
import { IPopulatedOrderDocument } from './email.service.js';
import { queueEmail } from '../lib/email-queue.js';
import { CheckoutProduct as InventoryCheckoutProduct } from '../types/inventory.types.js';
import { createLogger } from '../utils/logger.js';

interface ProductCheckout {
  _id: string;
  quantity: number;
  variantId?: string;
}

interface CheckoutProduct {
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
}

interface InventoryAdjustment {
  productId: string;
  productName: string;
  variantDetails?: string;
  requestedQuantity: number;
  adjustedQuantity: number;
  availableStock: number;
}

interface CheckoutSessionResult {
  sessionId: string;
  adjustments: InventoryAdjustment[];
}

export class PaymentService {
  private logger = createLogger({ service: 'PaymentService' });

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Count orders from today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const orderCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequence = (orderCount + 1).toString().padStart(4, '0');
    return `ORD-${year}${month}${day}-${sequence}`;
  }
  async createCheckoutSession(
    user: IUserDocument,
    products: ProductCheckout[],
    couponCode?: string,
  ): Promise<CheckoutSessionResult> {
    // Validate products exist and get server-side data
    const productIds = products.map(p => p._id);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    
    if (validProducts.length !== products.length) {
      throw new NotFoundError('One or more products');
    }

    // Calculate total amount and prepare line items
    let totalAmount = 0;
    const lineItems = [];
    const checkoutProducts: CheckoutProduct[] = [];
    const adjustments: InventoryAdjustment[] = [];

    for (const requestedProduct of products) {
      const serverProduct = validProducts.find(p => String(p._id) === requestedProduct._id);
      if (!serverProduct) {
        throw new NotFoundError('Product', requestedProduct._id as string);
      }

      let productPrice = serverProduct.price;
      let productName = serverProduct.name;
      let variantDetails: CheckoutProduct['variantDetails'];
      let variantLabel: string | undefined;

      // Handle variant pricing and validation
      if (requestedProduct.variantId) {
        const variant = serverProduct.variants?.find(v => v.variantId === requestedProduct.variantId);
        if (!variant) {
          throw new NotFoundError('Variant', requestedProduct.variantId);
        }

        // Check and adjust inventory availability using inventory service
        const availableStock = await inventoryService.getAvailableInventory(
          String(serverProduct._id),
          requestedProduct.variantId,
        );
        
        // Determine actual quantity that can be fulfilled
        let actualQuantity = requestedProduct.quantity;
        const variantInfoStr = variant.label ? ` (${variant.label})` : '';
        variantLabel = variant.label;
        
        if (availableStock === 0) {
          // Skip this item entirely if out of stock
          continue;
        } else if (availableStock < requestedProduct.quantity) {
          // Adjust quantity to available stock
          actualQuantity = availableStock;
          
          // Track the adjustment
          adjustments.push({
            productId: String(serverProduct._id),
            productName: serverProduct.name,
            variantDetails: variantInfoStr,
            requestedQuantity: requestedProduct.quantity,
            adjustedQuantity: actualQuantity,
            availableStock: availableStock,
          });
        }
        
        // Update the requested quantity for processing
        requestedProduct.quantity = actualQuantity;

        // Use variant price if available
        productPrice = variant.price;
        
        // Add variant details to product name
        const variantInfoArr = [];
        if (variant.size) variantInfoArr.push(`Size: ${variant.size}`);
        if (variant.color) variantInfoArr.push(`Color: ${variant.color}`);
        if (variantInfoArr.length > 0) {
          productName += ` (${variantInfoArr.join(', ')})`;
        }

        variantDetails = {
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
        };
      } else {
        // Handle non-variant products
        const availableStock = await inventoryService.getAvailableInventory(
          String(serverProduct._id),
        );
        
        // Determine actual quantity that can be fulfilled
        let actualQuantity = requestedProduct.quantity;
        
        if (availableStock === 0) {
          // Skip this item entirely if out of stock
          continue;
        } else if (availableStock < requestedProduct.quantity) {
          // Adjust quantity to available stock
          actualQuantity = availableStock;
          
          // Track the adjustment
          adjustments.push({
            productId: String(serverProduct._id),
            productName: serverProduct.name,
            variantDetails: undefined,
            requestedQuantity: requestedProduct.quantity,
            adjustedQuantity: actualQuantity,
            availableStock: availableStock,
          });
        }
        
        // Update the requested quantity for processing
        requestedProduct.quantity = actualQuantity;
      }

      const amount = Math.round(productPrice * 100);
      totalAmount += amount * requestedProduct.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: productName,
            images: [serverProduct.image],
            metadata: {
              productId: requestedProduct._id,
              variantId: requestedProduct.variantId ?? '',
            },
          },
          unit_amount: amount,
        },
        quantity: requestedProduct.quantity ?? 1,
      });

      checkoutProducts.push({
        id: requestedProduct._id,
        quantity: requestedProduct.quantity,
        price: productPrice,
        variantId: requestedProduct.variantId,
        variantDetails,
        variantLabel,
      });
    }

    // Check if we have any items after adjustments
    if (lineItems.length === 0) {
      throw new ValidationError('All items in your cart are currently out of stock');
    }

    // Handle coupon if provided
    let coupon = null;
    let stripeCouponId: string | undefined;
    
    if (couponCode) {
      // First try user-specific coupon
      coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        userId: user._id, 
        isActive: true, 
      });
      
      // If not found, try general discount code
      coupon = coupon ?? await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        userId: { $exists: false }, 
        isActive: true, 
      });
      
      if (coupon) {
        // Check if expired
        if (coupon.expirationDate < new Date()) {
          throw new ValidationError('Coupon has expired');
        }
        
        // Check max uses
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          throw new ValidationError('Coupon has reached maximum usage limit');
        }
        
        // Check minimum purchase amount
        const totalInDollars = totalAmount / 100;
        if (coupon.minimumPurchaseAmount && totalInDollars < coupon.minimumPurchaseAmount) {
          throw new ValidationError(`Minimum purchase amount of $${coupon.minimumPurchaseAmount} required`);
        }
        
        totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
        stripeCouponId = await this.createStripeCoupon(coupon.discountPercentage);
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: stripeCouponId
        ? [{ coupon: stripeCouponId }]
        : [],
      metadata: {
        userId: user._id.toString(),
        couponCode: couponCode ?? '',
        products: JSON.stringify(checkoutProducts),
      },
    });

    // Create gift coupon if order is over $200
    if (totalAmount >= 20000) {
      await this.createGiftCoupon(user._id.toString());
    }
    
    return {
      sessionId: session.id,
      adjustments,
    };
  }

  async processCheckoutSuccess(sessionId: string): Promise<{ orderId: mongoose.Types.ObjectId; totalAmount: number }> {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new PaymentError('Payment not completed', 'PAYMENT_FAILED');
    }

    // Use transaction to ensure atomicity between coupon usage and order creation
    const dbSession = await mongoose.startSession();
    let orderId: mongoose.Types.ObjectId | undefined;
    let totalAmount: number | undefined;
    let populatedOrder: IPopulatedOrderDocument | null = null;
    let user: IUserDocument | null = null;

    try {
      await dbSession.withTransaction(async () => {
        // Get user for email
        const User = (await import('../models/user.model.js')).User;
        user = await User.findById(session.metadata?.userId).session(dbSession);
        if (!user) {
          throw new NotFoundError('User');
        }

        // Parse products from session metadata
        const products = JSON.parse(session.metadata?.products ?? '[]') as CheckoutProduct[];
        
        // Step 1: Validate inventory atomically BEFORE creating order
        this.logger.info('checkout.inventory.validation.start', {
          sessionId,
          productCount: products.length,
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
          this.logger.error('checkout.inventory.validation.failed', {
            sessionId,
            errors: inventoryValidation.errors,
          });
          
          throw new InventoryError(
            `Insufficient inventory: ${inventoryValidation.errors.join('; ')}`,
            'INSUFFICIENT_INVENTORY',
            inventoryValidation.validatedProducts
              .filter(vp => vp.availableStock < vp.requestedQuantity)
              .map(vp => ({
                productId: vp.productId,
                productName: vp.productName,
                variantId: vp.variantId,
                variantDetails: vp.variantDetails,
                requestedQuantity: vp.requestedQuantity,
                availableStock: vp.availableStock,
              }))
          );
        }

        this.logger.info('checkout.inventory.validation.success', {
          sessionId,
          validatedCount: inventoryValidation.validatedProducts.length,
        });

        // Step 2: Increment coupon usage if used
        if (session.metadata?.couponCode) {
          await couponService.incrementUsage(session.metadata.couponCode);
        }

        // Step 3: Create order (inventory has been validated)
        const originalAmount = session.metadata?.couponCode 
          ? (session.amount_subtotal ?? session.amount_total ?? 0) / 100
          : undefined;
        
        const orderNumber = await this.generateOrderNumber();
        const subtotal = (session.amount_subtotal ?? session.amount_total ?? 0) / 100;
        const tax = ((session.total_details?.amount_tax ?? 0) / 100);
        const shipping = ((session.total_details?.amount_shipping ?? 0) / 100);
        const discount = ((session.total_details?.amount_discount ?? 0) / 100);
          
        const newOrder = new Order({
          orderNumber,
          user: session.metadata?.userId,
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
          shippingAddress: session.shipping_details?.address ? {
            fullName: session.shipping_details?.name ?? user.name ?? 'Customer',
            line1: session.shipping_details.address.line1 ?? '123 Default Street',
            line2: session.shipping_details.address.line2 ?? undefined,
            city: session.shipping_details.address.city ?? 'Default City',
            state: session.shipping_details.address.state ?? 'CA',
            postalCode: session.shipping_details.address.postal_code ?? '12345',
            country: session.shipping_details.address.country ?? 'USA',
            phone: session.customer_details?.phone ?? undefined,
          } : undefined,
          billingAddress: session.customer_details?.address ? {
            fullName: session.customer_details?.name ?? user.name ?? 'Customer',
            line1: session.customer_details.address.line1 ?? '123 Default Street',
            line2: session.customer_details.address.line2 ?? undefined,
            city: session.customer_details.address.city ?? 'Default City',
            state: session.customer_details.address.state ?? 'CA',
            postalCode: session.customer_details.address.postal_code ?? '12345',
            country: session.customer_details.address.country ?? 'USA',
          } : undefined,
          paymentMethod: 'card',
          paymentIntentId: session.payment_intent as string,
          couponCode: session.metadata?.couponCode ?? undefined,
          originalAmount,
          statusHistory: [{
            from: 'pending',
            to: 'completed',
            timestamp: new Date(),
            userId: session.metadata?.userId ? new mongoose.Types.ObjectId(session.metadata.userId) : undefined,
            reason: 'Payment processed successfully',
          }],
        });

        await newOrder.save({ session: dbSession });
        orderId = newOrder._id;
        totalAmount = newOrder.totalAmount;
        
        // Populate order for email
        populatedOrder = await Order.findById(orderId)
          .populate('products.product', 'name image price')
          .session(dbSession) as unknown as IPopulatedOrderDocument;

        // Step 4: Deduct inventory atomically (guaranteed to be valid due to earlier validation)
        for (const product of products) {
          try {
            // Use atomic deduction instead of updateInventory
            await inventoryService.atomicInventoryDeduction(
              product.id,
              product.variantId,
              product.quantity,
              dbSession
            );

            // Record inventory history within the same transaction
            await inventoryService.recordInventoryHistory(
              product.id,
              product.variantId,
              -product.quantity,
              'sale',
              session.metadata?.userId ?? 'system',
              { orderId: String(orderId) },
              dbSession
            );
          } catch (error) {
            this.logger.error('checkout.inventory.deduction.error', error, {
              sessionId,
              productId: product.id,
              variantId: product.variantId,
              quantity: product.quantity,
            });
            
            // This should rarely happen due to validation, but if it does, throw error
            if (error instanceof InventoryError) {
              throw error;
            }
            throw new AppError('Failed to update inventory during checkout', 500);
          }
        }
        
        // Clear the user's cart after successful payment
        const userId = session.metadata?.userId;
        if (userId) {
          const { User } = await import('../models/user.model.js');
          const foundUser = await User.findById(userId).session(dbSession);
          
          if (foundUser) {
            foundUser.cartItems = [];
            foundUser.appliedCoupon = null;
            await foundUser.save({ session: dbSession });
            user = foundUser;
          }
        }
      });
    } catch (error) {
      // Log and re-throw transaction errors
      this.logger.error('checkout.transaction.error', error, {
        sessionId,
      });
      throw error;
    } finally {
      await dbSession.endSession();
    }

    if (!orderId || totalAmount === undefined) {
      throw new AppError('Order creation failed', 500);
    }
    
    // Send order confirmation email using data from transaction
    try {
      if (user && populatedOrder) {
        await queueEmail('orderConfirmation', {
          order: populatedOrder,
          user,
        });
      }
    } catch (emailError) {
      // Log error but don't fail the order process
      console.error('Failed to send order confirmation email:', emailError);
    }
    
    return {
      orderId,
      totalAmount,
    };
  }

  private async createStripeCoupon(discountPercentage: number): Promise<string> {
    const coupon = await stripe.coupons.create({
      percent_off: discountPercentage,
      duration: 'once',
    });

    return coupon.id;
  }

  private async createGiftCoupon(userId: string): Promise<void> {
    // Delete any existing gift coupon for the user
    await Coupon.findOneAndDelete({ userId });

    const newCoupon = new Coupon({
      code: 'GIFT' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      userId: userId,
    });

    await newCoupon.save();
  }

  async refundOrder(orderId: string, reason = 'Customer requested refund'): Promise<void> {
    const dbSession = await mongoose.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        const order = await Order.findById(orderId).session(dbSession);
        if (!order) {
          throw new NotFoundError('Order');
        }

        if (order.status === 'refunded') {
          throw new ValidationError('Order already refunded');
        }

        // Process refund through Stripe
        if (order.stripeSessionId) {
          const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
          if (session.payment_intent) {
            await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
              reason: 'requested_by_customer',
            });
          }
        }

        // Restore inventory for each product
        for (const item of order.products) {
          await inventoryService.updateInventory(
            item.product.toString(),
            item.variantId,
            item.quantity, // Positive adjustment to restore inventory
            'return',
            'system',
            { orderId, reason },
          );
        }

        // Update order status
        order.status = 'refunded';
        await order.save({ session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const dbSession = await mongoose.startSession();
    
    try {
      await dbSession.withTransaction(async () => {
        const order = await Order.findById(orderId).session(dbSession);
        if (!order) {
          throw new NotFoundError('Order');
        }

        if (order.user.toString() !== userId) {
          throw new AuthorizationError('Unauthorized to cancel this order');
        }

        if (order.status !== 'pending') {
          throw new ValidationError('Only pending orders can be cancelled');
        }

        // Restore inventory for each product
        for (const item of order.products) {
          await inventoryService.updateInventory(
            item.product.toString(),
            item.variantId,
            item.quantity, // Positive adjustment to restore inventory
            'return',
            userId,
            { orderId, reason: 'Order cancelled by customer' },
          );
        }

        // Update order status
        order.status = 'cancelled';
        await order.save({ session: dbSession });
      });
    } finally {
      await dbSession.endSession();
    }
  }

}

export const paymentService = new PaymentService();
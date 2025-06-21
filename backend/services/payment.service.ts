import mongoose from 'mongoose';
import { stripe } from '../lib/stripe.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IUserDocument } from '../models/user.model.js';
import { couponService } from './coupon.service.js';
import { inventoryService } from './inventory.service.js';

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
  async createCheckoutSession(
    user: IUserDocument,
    products: ProductCheckout[],
    couponCode?: string,
  ): Promise<CheckoutSessionResult> {
    // Validate products exist and get server-side data
    const productIds = products.map(p => p._id);
    const validProducts = await Product.find({ _id: { $in: productIds } });
    
    if (validProducts.length !== products.length) {
      throw new AppError('One or more products not found', 404);
    }

    // Calculate total amount and prepare line items
    let totalAmount = 0;
    const lineItems = [];
    const checkoutProducts: CheckoutProduct[] = [];
    const adjustments: InventoryAdjustment[] = [];

    for (const requestedProduct of products) {
      const serverProduct = validProducts.find(p => String(p._id) === requestedProduct._id);
      if (!serverProduct) {
        throw new AppError(`Product ${requestedProduct._id} not found`, 404);
      }

      let productPrice = serverProduct.price;
      let productName = serverProduct.name;
      let variantDetails: CheckoutProduct['variantDetails'];

      // Handle variant pricing and validation
      if (requestedProduct.variantId) {
        const variant = serverProduct.variants?.find(v => v.variantId === requestedProduct.variantId);
        if (!variant) {
          throw new AppError(`Variant ${requestedProduct.variantId} not found for product ${serverProduct.name}`, 404);
        }

        // Check and adjust inventory availability using inventory service
        const availableStock = await inventoryService.getAvailableInventory(
          String(serverProduct._id),
          requestedProduct.variantId,
        );
        
        // Determine actual quantity that can be fulfilled
        let actualQuantity = requestedProduct.quantity;
        const variantInfoStr = variant.label ? ` (${variant.label})` : '';
        
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
        quantity: requestedProduct.quantity || 1,
      });

      checkoutProducts.push({
        id: requestedProduct._id,
        quantity: requestedProduct.quantity,
        price: productPrice,
        variantId: requestedProduct.variantId,
        variantDetails,
      });
    }

    // Check if we have any items after adjustments
    if (lineItems.length === 0) {
      throw new AppError('All items in your cart are currently out of stock', 400);
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
      coupon ??= await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        userId: { $exists: false }, 
        isActive: true, 
      });
      
      if (coupon) {
        // Check if expired
        if (coupon.expirationDate < new Date()) {
          throw new AppError('Coupon has expired', 400);
        }
        
        // Check max uses
        if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
          throw new AppError('Coupon has reached maximum usage limit', 400);
        }
        
        // Check minimum purchase amount
        const totalInDollars = totalAmount / 100;
        if (coupon.minimumPurchaseAmount && totalInDollars < coupon.minimumPurchaseAmount) {
          throw new AppError(`Minimum purchase amount of $${coupon.minimumPurchaseAmount} required`, 400);
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
      throw new AppError('Payment not completed', 400);
    }

    // Use transaction to ensure atomicity between coupon usage and order creation
    const dbSession = await mongoose.startSession();
    let orderId: mongoose.Types.ObjectId | undefined;
    let totalAmount: number | undefined;

    try {
      await dbSession.withTransaction(async () => {
        // Increment coupon usage if used
        if (session.metadata?.couponCode) {
          await couponService.incrementUsage(session.metadata.couponCode);
        }

        // Create order
        const products = JSON.parse(session.metadata?.products ?? '[]') as CheckoutProduct[];
        const newOrder = new Order({
          user: session.metadata?.userId,
          products: products.map(product => ({
            product: product.id,
            quantity: product.quantity,
            price: product.price,
            variantId: product.variantId,
            variantDetails: product.variantDetails,
          })),
          totalAmount: (session.amount_total ?? 0) / 100,
          stripeSessionId: sessionId,
        });

        await newOrder.save({ session: dbSession });
        orderId = newOrder._id;
        totalAmount = newOrder.totalAmount;

        // Decrement inventory for each product
        for (const product of products) {
          await inventoryService.updateInventory(
            product.id,
            product.variantId,
            -product.quantity,
            'sale',
            session.metadata?.userId ?? 'system',
            { orderId: String(orderId) },
          );
        }
        
        // Clear the user's cart after successful payment
        const userId = session.metadata?.userId;
        if (userId) {
          const { User } = await import('../models/user.model.js');
          const user = await User.findById(userId).session(dbSession);
          
          if (user) {
            user.cartItems = [];
            user.appliedCoupon = null;
            await user.save({ session: dbSession });
          }
        }
      });
    } finally {
      await dbSession.endSession();
    }

    if (!orderId || totalAmount === undefined) {
      throw new AppError('Order creation failed', 500);
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
          throw new AppError('Order not found', 404);
        }

        if (order.status === 'refunded') {
          throw new AppError('Order already refunded', 400);
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
          throw new AppError('Order not found', 404);
        }

        if (order.user.toString() !== userId) {
          throw new AppError('Unauthorized to cancel this order', 403);
        }

        if (order.status !== 'pending') {
          throw new AppError('Only pending orders can be cancelled', 400);
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
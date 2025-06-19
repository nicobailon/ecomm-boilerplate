import mongoose from 'mongoose';
import { stripe } from '../lib/stripe.js';
import { Coupon } from '../models/coupon.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { IUserDocument } from '../models/user.model.js';
import { couponService } from './coupon.service.js';

interface ProductCheckout {
  _id: string;
  quantity: number;
}

interface CheckoutProduct {
  id: string;
  quantity: number;
  price: number;
}

export class PaymentService {
  async createCheckoutSession(
    user: IUserDocument,
    products: ProductCheckout[],
    couponCode?: string,
  ): Promise<string> {
    // Validate products exist and get server-side data
    const productIds = products.map(p => p._id);
    const validProducts = await Product.find({ _id: { $in: productIds } }).lean();
    
    if (validProducts.length !== products.length) {
      throw new AppError('One or more products not found', 404);
    }

    // Calculate total amount and prepare line items
    let totalAmount = 0;
    const lineItems = [];
    const checkoutProducts: CheckoutProduct[] = [];

    for (const requestedProduct of products) {
      const serverProduct = validProducts.find(p => p._id.toString() === requestedProduct._id.toString());
      if (!serverProduct) {
        throw new AppError(`Product ${requestedProduct._id} not found`, 404);
      }

      const amount = Math.round(serverProduct.price * 100);
      totalAmount += amount * requestedProduct.quantity;

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: serverProduct.name,
            images: [serverProduct.image],
          },
          unit_amount: amount,
        },
        quantity: requestedProduct.quantity || 1,
      });

      checkoutProducts.push({
        id: requestedProduct._id,
        quantity: requestedProduct.quantity,
        price: serverProduct.price,
      });
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
      if (!coupon) {
        coupon = await Coupon.findOne({ 
          code: couponCode.toUpperCase(), 
          userId: { $exists: false }, 
          isActive: true, 
        });
      }
      
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
    
    return session.id;
  }

  async processCheckoutSuccess(sessionId: string): Promise<{ orderId: mongoose.Types.ObjectId; totalAmount: number }> {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new AppError('Payment not completed', 400);
    }

    // Use transaction to ensure atomicity between coupon usage and order creation
    const dbSession = await mongoose.startSession();
    let orderId: mongoose.Types.ObjectId;
    let totalAmount: number;

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
          })),
          totalAmount: (session.amount_total ?? 0) / 100,
          stripeSessionId: sessionId,
        });

        await newOrder.save({ session: dbSession });
        orderId = newOrder._id;
        totalAmount = newOrder.totalAmount;
      });
    } finally {
      await dbSession.endSession();
    }

    return {
      orderId: orderId!,
      totalAmount: totalAmount!,
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
}

export const paymentService = new PaymentService();
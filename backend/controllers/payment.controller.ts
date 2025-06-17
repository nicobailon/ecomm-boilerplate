import { Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthRequest } from '../types/express.js';
import { paymentService } from '../services/payment.service.js';

interface ProductCheckout {
  _id: string;
  quantity: number;
}

export const createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { products, couponCode }: { products: ProductCheckout[], couponCode?: string } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    throw new AppError("Invalid or empty products array", 400);
  }

  const result = await paymentService.createCheckoutSession(
    req.user!,
    products,
    couponCode
  );
  
  res.status(200).json({ 
    id: result.sessionId, 
    totalAmount: result.totalAmount 
  });
});

export const checkoutSuccess = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new AppError("Session ID is required", 400);
  }

  const result = await paymentService.processCheckoutSuccess(sessionId);

  res.status(200).json({
    success: true,
    message: "Payment successful, order created, and coupon deactivated if used.",
    orderId: result.orderId,
  });
});
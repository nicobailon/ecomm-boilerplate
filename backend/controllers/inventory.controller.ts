import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { inventoryService } from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import {
  inventoryUpdateSchema,
  bulkInventoryUpdateSchema,
  inventoryHistoryQuerySchema,
  inventoryCheckSchema,
  lowStockQuerySchema,
  inventoryTurnoverQuerySchema,
} from '../validations/inventory.validation.js';

export const getProductInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.params;
  const { variantId } = req.query;

  const inventory = await inventoryService.getProductInventoryInfo(
    productId,
    variantId as string | undefined
  );

  res.json({
    success: true,
    inventory,
  });
});

export const checkAvailability = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = inventoryCheckSchema.parse({
    productId: req.params.productId,
    variantId: req.query.variantId,
    quantity: req.query.quantity ? Number(req.query.quantity) : 1,
  });

  const isAvailable = await inventoryService.checkAvailability(
    validatedData.productId,
    validatedData.variantId,
    validatedData.quantity
  );

  const availableStock = await inventoryService.getAvailableInventory(
    validatedData.productId,
    validatedData.variantId
  );

  res.json({
    success: true,
    isAvailable,
    availableStock,
    requestedQuantity: validatedData.quantity,
  });
});

export const updateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = inventoryUpdateSchema.parse(req.body);

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const result = await inventoryService.updateInventory(
    validatedData.productId,
    validatedData.variantId,
    validatedData.adjustment,
    validatedData.reason,
    req.user._id.toString(),
    validatedData.metadata
  );

  res.json({
    success: true,
    result,
  });
});

export const bulkUpdateInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = bulkInventoryUpdateSchema.parse(req.body);

  if (!req.user) {
    throw new AppError('User not authenticated', 401);
  }

  const results = await inventoryService.bulkUpdateInventory(
    validatedData.updates,
    req.user._id.toString()
  );

  res.json({
    success: true,
    results,
  });
});

export const getInventoryHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = inventoryHistoryQuerySchema.parse({
    productId: req.params.productId,
    variantId: req.query.variantId,
    limit: req.query.limit,
    offset: req.query.offset,
  });

  const history = await inventoryService.getInventoryHistory(
    validatedData.productId,
    validatedData.variantId,
    validatedData.limit,
    validatedData.offset
  );

  res.json({
    success: true,
    ...history,
  });
});

export const getLowStockProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = lowStockQuerySchema.parse(req.query);

  const alerts = await inventoryService.getLowStockProducts(validatedData.threshold);
  const startIndex = (validatedData.page - 1) * validatedData.limit;
  const endIndex = startIndex + validatedData.limit;
  const paginatedAlerts = alerts.slice(startIndex, endIndex);

  res.json({
    success: true,
    alerts: paginatedAlerts,
    total: alerts.length,
    page: validatedData.page,
    totalPages: Math.ceil(alerts.length / validatedData.limit),
  });
});

export const getInventoryMetrics = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const metrics = await inventoryService.getInventoryMetrics();

  res.json({
    success: true,
    metrics,
  });
});

export const getOutOfStockProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const products = await inventoryService.getOutOfStockProducts();

  res.json({
    success: true,
    products,
  });
});

export const getInventoryTurnover = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = inventoryTurnoverQuerySchema.parse(req.query);

  const turnover = await inventoryService.getInventoryTurnover({
    start: validatedData.startDate,
    end: validatedData.endDate,
  });

  res.json({
    success: true,
    turnover,
  });
});
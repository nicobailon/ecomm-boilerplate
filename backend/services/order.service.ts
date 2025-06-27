import mongoose from 'mongoose';
import { Order, IOrderDocument } from '../models/order.model.js';
import { AppError } from '../utils/AppError.js';
import type { 
  ListOrdersInput, 
  UpdateOrderStatusInput, 
  BulkUpdateOrderStatusInput, 
  GetOrderStatsInput 
} from '../validations/order.validation.js';
import type { 
  OrderListResponse, 
  OrderWithPopulatedData, 
  BulkUpdateResponse, 
  OrderStats 
} from '../types/order.types.js';

export class OrderService {
  async listAllOrders(options: ListOrdersInput): Promise<OrderListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = options;

    const pipeline: mongoose.PipelineStage[] = [];

    const matchStage: mongoose.FilterQuery<IOrderDocument> = {};
    
    if (status !== 'all') {
      matchStage.status = status;
    }

    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) {
        matchStage.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        matchStage.createdAt.$lte = new Date(dateTo);
      }
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'products.product',
          foreignField: '_id',
          as: 'populatedProducts',
        },
      }
    );

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.email': { $regex: search, $options: 'i' } },
            { _id: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $addFields: {
        products: {
          $map: {
            input: '$products',
            as: 'orderProduct',
            in: {
              $mergeObjects: [
                '$$orderProduct',
                {
                  product: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$populatedProducts',
                          cond: { $eq: ['$$this._id', '$$orderProduct.product'] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    });

    pipeline.push({
      $project: {
        populatedProducts: 0,
        'user.password': 0,
        'user.refreshToken': 0,
        'user.role': 0,
        'user.cartItems': 0,
        'user.appliedCoupon': 0,
      },
    });

    const sortField = sortBy === 'total' ? 'totalAmount' : sortBy;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    pipeline.push(
      {
        $facet: {
          orders: [
            { $sort: { [sortField]: sortDirection } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ],
          totalCount: [{ $count: 'count' }],
        },
      }
    );

    const result = await Order.aggregate(pipeline).exec();

    if (result.length === 0 || !result[0]) {
      return {
        orders: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
      };
    }

    const { orders = [], totalCount = [] } = result[0];
    const total = totalCount[0]?.count || 0;

    return {
      orders: orders as OrderWithPopulatedData[],
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(orderId: string): Promise<OrderWithPopulatedData> {
    const order = await Order.findById(orderId)
      .populate('user', 'email name')
      .populate('products.product', 'name image');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order as unknown as OrderWithPopulatedData;
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<IOrderDocument> {
    const { orderId, status } = input;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const invalidTransitions: Record<string, string[]> = {
      cancelled: ['completed', 'refunded'],
      refunded: ['completed', 'cancelled'],
    };

    if (invalidTransitions[order.status]?.includes(status)) {
      throw new AppError(`Cannot change status from ${order.status} to ${status}`, 400);
    }

    order.status = status;
    await order.save();

    return order;
  }

  async bulkUpdateOrderStatus(input: BulkUpdateOrderStatusInput): Promise<BulkUpdateResponse> {
    const { orderIds, status } = input;

    const result = await Order.updateMany(
      {
        _id: { $in: orderIds },
        status: { $nin: ['cancelled', 'refunded'] },
      },
      {
        $set: { status, updatedAt: new Date() },
      }
    );

    if (result.matchedCount === 0) {
      throw new AppError('No orders were updated', 404);
    }

    const notUpdatedCount = orderIds.length - result.modifiedCount;
    let message = `Successfully updated ${result.modifiedCount} orders`;
    
    if (notUpdatedCount > 0) {
      message += ` (${notUpdatedCount} orders were not updated - may be cancelled/refunded)`;
    }

    return {
      success: true,
      message,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async getOrderStats(options: GetOrderStatsInput): Promise<OrderStats> {
    const pipeline: mongoose.PipelineStage[] = [];

    if (options.dateFrom || options.dateTo) {
      const matchStage: mongoose.FilterQuery<IOrderDocument> = { createdAt: {} };
      
      if (options.dateFrom) {
        matchStage.createdAt.$gte = new Date(options.dateFrom);
      }
      if (options.dateTo) {
        matchStage.createdAt.$lte = new Date(options.dateTo);
      }
      
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                averageOrderValue: { $avg: '$totalAmount' },
              },
            },
          ],
          statusCounts: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          revenueByDay: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' },
                  day: { $dayOfMonth: '$createdAt' },
                },
                revenue: { $sum: '$totalAmount' },
                count: { $sum: 1 },
              },
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
            { $limit: 30 },
          ],
          topProducts: [
            { $unwind: '$products' },
            {
              $group: {
                _id: '$products.product',
                totalSold: { $sum: '$products.quantity' },
                revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
              },
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productInfo',
              },
            },
            { $unwind: '$productInfo' },
            {
              $project: {
                _id: 1,
                name: '$productInfo.name',
                totalSold: 1,
                revenue: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          totalOrders: { $arrayElemAt: ['$overview.totalOrders', 0] },
          totalRevenue: { $arrayElemAt: ['$overview.totalRevenue', 0] },
          averageOrderValue: { $arrayElemAt: ['$overview.averageOrderValue', 0] },
          statusCounts: 1,
          revenueByDay: 1,
          topProducts: 1,
        },
      },
    );

    const result = await Order.aggregate(pipeline);

    if (result.length === 0 || !result[0]) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {
          pending: 0,
          completed: 0,
          cancelled: 0,
          refunded: 0,
        },
        revenueByDay: [],
        topProducts: [],
      };
    }

    const stats = result[0];
    
    const statusBreakdown = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    stats.statusCounts.forEach((status: { _id: string; count: number }) => {
      if (status._id in statusBreakdown) {
        statusBreakdown[status._id as keyof typeof statusBreakdown] = status.count;
      }
    });

    return {
      totalOrders: stats.totalOrders || 0,
      totalRevenue: stats.totalRevenue || 0,
      averageOrderValue: stats.averageOrderValue || 0,
      statusBreakdown,
      revenueByDay: stats.revenueByDay || [],
      topProducts: stats.topProducts || [],
    };
  }
}

export const orderService = new OrderService();
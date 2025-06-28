import mongoose from 'mongoose';
import { Order, IOrderDocument } from '../models/order.model.js';
import { AppError } from '../utils/AppError.js';
import { OrderStatusValidator } from '../utils/order-status-validator.js';
import type { 
  ListOrdersInput, 
  UpdateOrderStatusInput, 
  BulkUpdateOrderStatusInput, 
  GetOrderStatsInput 
} from '../validations/order.validation.js';
import type { 
  OrderWithPopulatedData, 
  BulkUpdateResponse 
} from '../types/order.types.js';
import { 
  toSerializedOrder, 
  toSerializedOrderStats,
  type SerializedOrderListResponse,
  type SerializedOrder,
  type SerializedOrderStats
} from '../utils/order-type-converters.js';

export class OrderService {
  async listAllOrders(options: ListOrdersInput & { userId?: string }): Promise<SerializedOrderListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
      userId,
    } = options;

    const pipeline: mongoose.PipelineStage[] = [];

    const matchStage: mongoose.FilterQuery<IOrderDocument> = {};
    
    if (userId) {
      matchStage.user = new mongoose.Types.ObjectId(userId);
    }
    
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
      orders: (orders as OrderWithPopulatedData[]).map(toSerializedOrder),
      totalCount: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderById(orderId: string, userId?: string): Promise<SerializedOrder> {
    const query = userId
      ? Order.findOne({ _id: orderId, user: userId })
      : Order.findById(orderId);
    
    const order = await query
      .populate('user', 'email name')
      .populate('products.product', 'name image');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return toSerializedOrder(order as unknown as OrderWithPopulatedData);
  }

  async updateOrderStatus(input: UpdateOrderStatusInput & { userId?: string; reason?: string }): Promise<SerializedOrder> {
    const { orderId, status, userId, reason } = input;

    // Check if we can use transactions (requires replica set)
    // For simplicity, try to use transactions and catch if not supported
    const useTransaction = mongoose.connection.readyState === 1;

    if (useTransaction) {
      // Use transaction for atomic update
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        const order = await Order.findById(orderId).session(session);
        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Use centralized validator
        OrderStatusValidator.validateTransition({
          from: order.status,
          to: status,
          userId,
          reason
        });

        // Add to status history
        order.statusHistory.push({
          from: order.status,
          to: status,
          timestamp: new Date(),
          userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
          reason
        });

        order.status = status;
        await order.save({ session });

        await session.commitTransaction();
        
        // Re-fetch with populated data (outside transaction for population)
        const updatedOrder = await Order.findById(orderId)
          .populate('user', 'email name')
          .populate('products.product', 'name image');
        
        return toSerializedOrder(updatedOrder as unknown as OrderWithPopulatedData);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Non-transactional update for environments without replica set
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      // Use centralized validator
      OrderStatusValidator.validateTransition({
        from: order.status,
        to: status,
        userId,
        reason
      });

      // Add to status history
      order.statusHistory.push({
        from: order.status,
        to: status,
        timestamp: new Date(),
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        reason
      });

      order.status = status;
      await order.save();

      // Re-fetch with populated data
      const updatedOrder = await Order.findById(orderId)
        .populate('user', 'email name')
        .populate('products.product', 'name image');
      
      return toSerializedOrder(updatedOrder as unknown as OrderWithPopulatedData);
    }
  }

  async bulkUpdateOrderStatus(input: BulkUpdateOrderStatusInput & { userId?: string; reason?: string }): Promise<BulkUpdateResponse> {
    const { orderIds, status, userId, reason } = input;

    // Check if we can use transactions (requires replica set)
    // For simplicity, try to use transactions and catch if not supported
    const useTransaction = mongoose.connection.readyState === 1;

    if (useTransaction) {
      // Use transaction for atomic bulk update
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Fetch all orders to validate transitions individually
        const orders = await Order.find({ _id: { $in: orderIds } }).session(session);
        
        if (orders.length === 0) {
          throw new AppError('No orders found', 404);
        }

        // Validate all transitions
        const transitions = orders.map(order => ({
          orderId: order._id.toString(),
          from: order.status,
          to: status,
          userId,
          reason
        }));

        const validation = OrderStatusValidator.validateBulkTransitions(
          transitions.map(({ from, to, userId, reason }) => ({ from, to, userId, reason }))
        );

        if (validation.valid.length === 0) {
          throw new AppError('No valid status transitions found', 422);
        }

        // Get valid order IDs and prepare bulk operations
        const validOrderIds = transitions
          .filter((_, index) => validation.valid.includes(validation.valid[index]))
          .map(t => t.orderId);

        const timestamp = new Date();
        const bulkOps = validOrderIds.map(orderId => {
          const order = orders.find(o => o._id.toString() === orderId)!;
          return {
            updateOne: {
              filter: { _id: orderId },
              update: {
                $set: { status },
                $push: {
                  statusHistory: {
                    from: order.status,
                    to: status,
                    timestamp,
                    userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
                    reason
                  }
                }
              }
            }
          };
        });

        // Execute bulk update
        const bulkResult = await Order.bulkWrite(bulkOps, { session });
        const modifiedCount = bulkResult.modifiedCount || 0;

        await session.commitTransaction();

        let message = `Successfully updated ${modifiedCount} orders`;
        
        if (validation.invalid.length > 0) {
          const invalidCount = validation.invalid.length;
          const firstError = validation.invalid[0].error;
          message += ` (${invalidCount} orders were not updated - ${firstError})`;
        }

        return {
          success: modifiedCount > 0,
          message,
          matchedCount: orders.length,
          modifiedCount,
        };
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // Non-transactional bulk update
      const orders = await Order.find({ _id: { $in: orderIds } });
      
      if (orders.length === 0) {
        throw new AppError('No orders found', 404);
      }

      // Validate all transitions
      const transitions = orders.map(order => ({
        orderId: order._id.toString(),
        from: order.status,
        to: status,
        userId,
        reason
      }));

      const validation = OrderStatusValidator.validateBulkTransitions(
        transitions.map(({ from, to, userId, reason }) => ({ from, to, userId, reason }))
      );

      if (validation.valid.length === 0) {
        throw new AppError('No valid status transitions found', 422);
      }

      // Get valid order IDs and prepare bulk operations
      const validOrderIds = transitions
        .filter((_, index) => validation.valid.includes(validation.valid[index]))
        .map(t => t.orderId);

      const timestamp = new Date();
      const bulkOps = validOrderIds.map(orderId => {
        const order = orders.find(o => o._id.toString() === orderId)!;
        return {
          updateOne: {
            filter: { _id: orderId },
            update: {
              $set: { status },
              $push: {
                statusHistory: {
                  from: order.status,
                  to: status,
                  timestamp,
                  userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
                  reason
                }
              }
            }
          }
        };
      });

      // Execute bulk update
      const bulkResult = await Order.bulkWrite(bulkOps);
      const modifiedCount = bulkResult.modifiedCount || 0;

      let message = `Successfully updated ${modifiedCount} orders`;
      
      if (validation.invalid.length > 0) {
        const invalidCount = validation.invalid.length;
        const firstError = validation.invalid[0].error;
        message += ` (${invalidCount} orders were not updated - ${firstError})`;
      }

      return {
        success: modifiedCount > 0,
        message,
        matchedCount: orders.length,
        modifiedCount,
      };
    }
  }

  async getOrderStats(options: GetOrderStatsInput): Promise<SerializedOrderStats> {
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
      return toSerializedOrderStats({
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
      });
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

    return toSerializedOrderStats({
      totalOrders: stats.totalOrders || 0,
      totalRevenue: stats.totalRevenue || 0,
      averageOrderValue: stats.averageOrderValue || 0,
      statusBreakdown,
      revenueByDay: stats.revenueByDay || [],
      topProducts: stats.topProducts || [],
    });
  }
}

export const orderService = new OrderService();
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';
import { AppError } from '../utils/AppError.js';

interface AnalyticsData {
  users: number;
  products: number;
  totalSales: number;
  totalRevenue: number;
}

interface DailySalesData {
  date: string;
  sales: number;
  revenue: number;
}

interface SalesAggregateResult {
  _id: null;
  totalSales: number;
  totalRevenue: number;
}

interface DailySalesAggregateResult {
  _id: string;
  sales: number;
  revenue: number;
}

export class AnalyticsService {
  async getAnalyticsData(): Promise<AnalyticsData> {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate<SalesAggregateResult>([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const { totalSales, totalRevenue } = salesData[0] ?? { totalSales: 0, totalRevenue: 0 };

    return {
      users: totalUsers,
      products: totalProducts,
      totalSales,
      totalRevenue,
    };
  }

  async getDailySalesData(startDate?: string, endDate?: string): Promise<DailySalesData[]> {
    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format', 400);
    }

    if (start > end) {
      throw new AppError('Start date must be before end date', 400);
    }

    const dailySalesData = await Order.aggregate<DailySalesAggregateResult>([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dateArray = this.getDatesInRange(start, end);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item._id === date);

      return {
        date,
        sales: foundData?.sales ?? 0,
        revenue: foundData?.revenue ?? 0,
      };
    });
  }

  private getDatesInRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}

export const analyticsService = new AnalyticsService();
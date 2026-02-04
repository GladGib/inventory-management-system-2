import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSalesSummary(organizationId: string, query: ReportQueryDto) {
    const { fromDate, toDate, warehouseId } = query;

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const where: any = {
      organizationId,
      status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'INVOICED', 'CLOSED'] },
    };

    if (Object.keys(dateFilter).length > 0) {
      where.orderDate = dateFilter;
    }
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    // Get orders with lines
    const orders = await this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    const productSales: Record<string, { item: any; quantity: number; revenue: number }> = {};
    const customerSpending: Record<string, { customer: any; orderCount: number; totalSpent: number }> = {};
    const salesByDay: Record<string, { revenue: number; orderCount: number }> = {};
    const ordersByStatus: Record<string, number> = {};

    orders.forEach((order: any) => {
      const orderTotal = Number(order.total);
      totalRevenue += orderTotal;

      // Track by status
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;

      // Track by customer
      if (!customerSpending[order.customerId]) {
        customerSpending[order.customerId] = {
          customer: order.customer,
          orderCount: 0,
          totalSpent: 0,
        };
      }
      customerSpending[order.customerId].orderCount++;
      customerSpending[order.customerId].totalSpent += orderTotal;

      // Track by day
      const dateKey = order.orderDate.toISOString().split('T')[0];
      if (!salesByDay[dateKey]) {
        salesByDay[dateKey] = { revenue: 0, orderCount: 0 };
      }
      salesByDay[dateKey].revenue += orderTotal;
      salesByDay[dateKey].orderCount++;

      // Track products
      order.lines.forEach((line: any) => {
        const itemCost = Number(line.item.costPrice) * line.quantity;
        totalCost += itemCost;

        if (!productSales[line.itemId]) {
          productSales[line.itemId] = {
            item: line.item,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[line.itemId].quantity += line.quantity;
        productSales[line.itemId].revenue += Number(line.lineTotal);
      });
    });

    // Format results
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        itemId: p.item.id,
        itemCode: p.item.code,
        itemName: p.item.name,
        quantity: p.quantity,
        revenue: p.revenue,
      }));

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map(c => ({
        customerId: c.customer.id,
        customerName: c.customer.companyName,
        orderCount: c.orderCount,
        totalSpent: c.totalSpent,
      }));

    const salesByDayArray = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data,
      }));

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalCost,
      totalProfit: totalRevenue - totalCost,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      ordersByStatus: Object.entries(ordersByStatus).map(([status, count]) => ({
        status,
        count,
      })),
      topProducts,
      topCustomers,
      salesByDay: salesByDayArray,
    };
  }

  async getInventorySummary(organizationId: string, query: ReportQueryDto) {
    const { warehouseId, categoryId } = query;

    // Get all items with stock levels
    const itemsWhere: any = { organizationId, isActive: true };
    if (categoryId) itemsWhere.categoryId = categoryId;

    const items = await this.prisma.item.findMany({
      where: itemsWhere,
      include: {
        category: true,
        stockLevels: warehouseId
          ? { where: { warehouseId } }
          : { include: { warehouse: true } },
      },
    });

    // Get recent sales for slow-moving analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await this.prisma.salesOrderLine.groupBy({
      by: ['itemId'],
      where: {
        salesOrder: {
          organizationId,
          orderDate: { gte: thirtyDaysAgo },
          status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'INVOICED', 'CLOSED'] },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const salesByItem = new Map(recentSales.map((s: any) => [s.itemId, s._sum.quantity || 0]));

    // Calculate metrics
    let totalValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    const stockByCategory: Record<string, { category: any; itemCount: number; totalValue: number }> = {};
    const stockByWarehouse: Record<string, { warehouse: any; itemCount: number; totalValue: number }> = {};

    items.forEach((item: any) => {
      const totalStock = item.stockLevels.reduce((sum: number, sl: any) => sum + sl.onHand, 0);
      const itemValue = totalStock * Number(item.costPrice);
      totalValue += itemValue;

      if (totalStock <= 0) {
        outOfStockItems++;
      } else if (item.reorderPoint && totalStock <= item.reorderPoint) {
        lowStockItems++;
      }

      // By category
      const catId = item.categoryId || 'uncategorized';
      if (!stockByCategory[catId]) {
        stockByCategory[catId] = {
          category: item.category || { id: 'uncategorized', name: 'Uncategorized' },
          itemCount: 0,
          totalValue: 0,
        };
      }
      stockByCategory[catId].itemCount++;
      stockByCategory[catId].totalValue += itemValue;

      // By warehouse
      item.stockLevels.forEach((sl: any) => {
        if (!stockByWarehouse[sl.warehouseId]) {
          stockByWarehouse[sl.warehouseId] = {
            warehouse: (sl as any).warehouse || { id: sl.warehouseId, name: 'Unknown' },
            itemCount: 0,
            totalValue: 0,
          };
        }
        stockByWarehouse[sl.warehouseId].itemCount++;
        stockByWarehouse[sl.warehouseId].totalValue += sl.onHand * Number(item.costPrice);
      });
    });

    // Top selling items (last 30 days)
    const topSellingItems = items
      .map((item: any) => ({
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        soldQuantity: salesByItem.get(item.id) || 0,
      }))
      .filter((i: any) => i.soldQuantity > 0)
      .sort((a: any, b: any) => b.soldQuantity - a.soldQuantity)
      .slice(0, 10);

    // Slow moving items (no sales in 30 days with stock > 0)
    const slowMovingItems = items
      .filter((item: any) => {
        const totalStock = item.stockLevels.reduce((sum: number, sl: any) => sum + sl.onHand, 0);
        return totalStock > 0 && !salesByItem.has(item.id);
      })
      .slice(0, 10)
      .map((item: any) => ({
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        daysSinceLastSale: 30, // Simplified - could track actual last sale date
      }));

    return {
      totalItems: items.length,
      totalValue,
      lowStockItems,
      outOfStockItems,
      stockByCategory: Object.values(stockByCategory).map(c => ({
        categoryId: c.category.id,
        categoryName: c.category.name,
        itemCount: c.itemCount,
        totalValue: c.totalValue,
      })),
      stockByWarehouse: Object.values(stockByWarehouse).map(w => ({
        warehouseId: w.warehouse.id,
        warehouseName: w.warehouse.name,
        itemCount: w.itemCount,
        totalValue: w.totalValue,
      })),
      topSellingItems,
      slowMovingItems,
    };
  }

  async getPurchaseSummary(organizationId: string, query: ReportQueryDto) {
    const { fromDate, toDate } = query;

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const where: any = { organizationId };
    if (Object.keys(dateFilter).length > 0) {
      where.orderDate = dateFilter;
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: true,
      },
    });

    let totalSpent = 0;
    let pendingOrders = 0;
    const vendorSpending: Record<string, { vendor: any; orderCount: number; totalSpent: number }> = {};
    const purchasesByMonth: Record<string, { amount: number; orderCount: number }> = {};

    orders.forEach((order: any) => {
      const orderTotal = Number(order.total);

      if (['DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED'].includes(order.status)) {
        pendingOrders++;
      }

      if (['ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'BILLED', 'CLOSED'].includes(order.status)) {
        totalSpent += orderTotal;
      }

      // By vendor
      if (!vendorSpending[order.vendorId]) {
        vendorSpending[order.vendorId] = {
          vendor: order.vendor,
          orderCount: 0,
          totalSpent: 0,
        };
      }
      vendorSpending[order.vendorId].orderCount++;
      vendorSpending[order.vendorId].totalSpent += orderTotal;

      // By month
      const monthKey = order.orderDate.toISOString().slice(0, 7);
      if (!purchasesByMonth[monthKey]) {
        purchasesByMonth[monthKey] = { amount: 0, orderCount: 0 };
      }
      purchasesByMonth[monthKey].amount += orderTotal;
      purchasesByMonth[monthKey].orderCount++;
    });

    return {
      totalOrders: orders.length,
      totalSpent,
      pendingOrders,
      topVendors: Object.values(vendorSpending)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(v => ({
          vendorId: v.vendor.id,
          vendorName: v.vendor.companyName,
          orderCount: v.orderCount,
          totalSpent: v.totalSpent,
        })),
      purchasesByMonth: Object.entries(purchasesByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          ...data,
        })),
    };
  }

  async getReceivablesSummary(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: {
        customer: true,
      },
    });

    const now = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    const agingBuckets = {
      current: { amount: 0, count: 0 },
      '1-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '90+': { amount: 0, count: 0 },
    };

    const customerOutstanding: Record<string, { customer: any; outstanding: number; overdue: number }> = {};

    invoices.forEach((invoice: any) => {
      const balanceDue = Number(invoice.total) - Number(invoice.amountPaid);
      totalOutstanding += balanceDue;

      const daysOverdue = Math.floor(
        (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 0) {
        totalOverdue += balanceDue;
        overdueCount++;
      }

      // Aging buckets
      if (daysOverdue <= 0) {
        agingBuckets.current.amount += balanceDue;
        agingBuckets.current.count++;
      } else if (daysOverdue <= 30) {
        agingBuckets['1-30'].amount += balanceDue;
        agingBuckets['1-30'].count++;
      } else if (daysOverdue <= 60) {
        agingBuckets['31-60'].amount += balanceDue;
        agingBuckets['31-60'].count++;
      } else if (daysOverdue <= 90) {
        agingBuckets['61-90'].amount += balanceDue;
        agingBuckets['61-90'].count++;
      } else {
        agingBuckets['90+'].amount += balanceDue;
        agingBuckets['90+'].count++;
      }

      // By customer
      if (!customerOutstanding[invoice.customerId]) {
        customerOutstanding[invoice.customerId] = {
          customer: invoice.customer,
          outstanding: 0,
          overdue: 0,
        };
      }
      customerOutstanding[invoice.customerId].outstanding += balanceDue;
      if (daysOverdue > 0) {
        customerOutstanding[invoice.customerId].overdue += balanceDue;
      }
    });

    return {
      totalOutstanding,
      totalOverdue,
      overdueCount,
      agingBuckets: Object.entries(agingBuckets).map(([bucket, data]) => ({
        bucket,
        ...data,
      })),
      topDebtors: Object.values(customerOutstanding)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 10)
        .map(c => ({
          customerId: c.customer.id,
          customerName: c.customer.companyName,
          outstanding: c.outstanding,
          overdue: c.overdue,
        })),
    };
  }

  async getPayablesSummary(organizationId: string) {
    const bills = await this.prisma.purchaseBill.findMany({
      where: {
        organizationId,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: {
        vendor: true,
      },
    });

    const now = new Date();
    let totalOutstanding = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    const agingBuckets = {
      current: { amount: 0, count: 0 },
      '1-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '90+': { amount: 0, count: 0 },
    };

    const vendorOutstanding: Record<string, { vendor: any; outstanding: number; overdue: number }> = {};

    bills.forEach((bill: any) => {
      const balanceDue = Number(bill.total) - Number(bill.amountPaid);
      totalOutstanding += balanceDue;

      const daysOverdue = Math.floor(
        (now.getTime() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 0) {
        totalOverdue += balanceDue;
        overdueCount++;
      }

      // Aging buckets
      if (daysOverdue <= 0) {
        agingBuckets.current.amount += balanceDue;
        agingBuckets.current.count++;
      } else if (daysOverdue <= 30) {
        agingBuckets['1-30'].amount += balanceDue;
        agingBuckets['1-30'].count++;
      } else if (daysOverdue <= 60) {
        agingBuckets['31-60'].amount += balanceDue;
        agingBuckets['31-60'].count++;
      } else if (daysOverdue <= 90) {
        agingBuckets['61-90'].amount += balanceDue;
        agingBuckets['61-90'].count++;
      } else {
        agingBuckets['90+'].amount += balanceDue;
        agingBuckets['90+'].count++;
      }

      // By vendor
      if (!vendorOutstanding[bill.vendorId]) {
        vendorOutstanding[bill.vendorId] = {
          vendor: bill.vendor,
          outstanding: 0,
          overdue: 0,
        };
      }
      vendorOutstanding[bill.vendorId].outstanding += balanceDue;
      if (daysOverdue > 0) {
        vendorOutstanding[bill.vendorId].overdue += balanceDue;
      }
    });

    return {
      totalOutstanding,
      totalOverdue,
      overdueCount,
      agingBuckets: Object.entries(agingBuckets).map(([bucket, data]) => ({
        bucket,
        ...data,
      })),
      topCreditors: Object.values(vendorOutstanding)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 10)
        .map(v => ({
          vendorId: v.vendor.id,
          vendorName: v.vendor.companyName,
          outstanding: v.outstanding,
          overdue: v.overdue,
        })),
    };
  }

  async getStockValuation(organizationId: string, query: ReportQueryDto) {
    const { warehouseId, categoryId } = query;

    const itemsWhere: any = { organizationId, isActive: true, deletedAt: null };
    if (categoryId) itemsWhere.categoryId = categoryId;

    const items = await this.prisma.item.findMany({
      where: itemsWhere,
      include: {
        category: true,
        stockLevels: warehouseId
          ? { where: { warehouseId }, include: { warehouse: true } }
          : { include: { warehouse: true } },
      },
      orderBy: { code: 'asc' },
    });

    let totalQuantity = 0;
    let totalValue = 0;

    const itemValuations = items.map((item: any) => {
      const stockByWarehouse = item.stockLevels.map((sl: any) => ({
        warehouseId: sl.warehouseId,
        warehouseName: sl.warehouse?.name || 'Unknown',
        quantity: sl.onHand,
        value: sl.onHand * Number(item.costPrice),
      }));

      const totalStock = stockByWarehouse.reduce((sum: number, sl: any) => sum + sl.quantity, 0);
      const itemValue = totalStock * Number(item.costPrice);

      totalQuantity += totalStock;
      totalValue += itemValue;

      return {
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        categoryName: item.category?.name || 'Uncategorized',
        unitCost: Number(item.costPrice),
        totalQuantity: totalStock,
        totalValue: itemValue,
        stockByWarehouse,
      };
    });

    return {
      summary: {
        totalItems: items.length,
        totalQuantity,
        totalValue,
      },
      items: itemValuations.filter((i: any) => i.totalQuantity > 0),
    };
  }

  async getSalesByCustomer(organizationId: string, query: ReportQueryDto) {
    const { fromDate, toDate } = query;

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = new Date(fromDate);
    if (toDate) dateFilter.lte = new Date(toDate);

    const where: any = {
      organizationId,
      status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'INVOICED', 'CLOSED'] },
    };

    if (Object.keys(dateFilter).length > 0) {
      where.orderDate = dateFilter;
    }

    const orders = await this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        lines: {
          include: {
            item: true,
          },
        },
      },
    });

    const customerData: Record<string, {
      customer: any;
      orderCount: number;
      totalQuantity: number;
      totalRevenue: number;
      totalCost: number;
      orders: any[];
    }> = {};

    orders.forEach((order: any) => {
      if (!customerData[order.customerId]) {
        customerData[order.customerId] = {
          customer: order.customer,
          orderCount: 0,
          totalQuantity: 0,
          totalRevenue: 0,
          totalCost: 0,
          orders: [],
        };
      }

      const data = customerData[order.customerId];
      data.orderCount++;
      data.totalRevenue += Number(order.total);

      order.lines.forEach((line: any) => {
        data.totalQuantity += line.quantity;
        data.totalCost += Number(line.item.costPrice) * line.quantity;
      });

      data.orders.push({
        orderId: order.id,
        orderNumber: order.orderNo,
        orderDate: order.orderDate,
        status: order.status,
        total: Number(order.total),
      });
    });

    const customers = Object.values(customerData)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((c: any) => ({
        customerId: c.customer.id,
        customerCode: c.customer.code,
        customerName: c.customer.companyName || c.customer.contactName,
        orderCount: c.orderCount,
        totalQuantity: c.totalQuantity,
        totalRevenue: c.totalRevenue,
        totalProfit: c.totalRevenue - c.totalCost,
        averageOrderValue: c.orderCount > 0 ? c.totalRevenue / c.orderCount : 0,
        recentOrders: c.orders.slice(0, 5),
      }));

    const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalProfit = customers.reduce((sum, c) => sum + c.totalProfit, 0);

    return {
      summary: {
        totalCustomers: customers.length,
        totalOrders: orders.length,
        totalRevenue,
        totalProfit,
      },
      customers,
    };
  }

  async getDashboardStats(organizationId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalItems,
      lowStockCount,
      pendingSalesOrders,
      pendingPurchaseOrders,
      recentSales,
      recentMovements,
    ] = await Promise.all([
      this.prisma.item.count({ where: { organizationId, isActive: true } }),
      this.prisma.stockLevel.count({
        where: {
          item: {
            organizationId,
            isActive: true,
            reorderPoint: { not: null },
          },
          onHand: { lte: this.prisma.stockLevel.fields.onHand },
        },
      }),
      this.prisma.salesOrder.count({
        where: {
          organizationId,
          status: { in: ['CONFIRMED', 'PICKING', 'PACKED'] },
        },
      }),
      this.prisma.purchaseOrder.count({
        where: {
          organizationId,
          status: { in: ['ISSUED', 'PARTIALLY_RECEIVED'] },
        },
      }),
      this.prisma.salesOrder.aggregate({
        where: {
          organizationId,
          status: { in: ['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'INVOICED', 'CLOSED'] },
          orderDate: { gte: thirtyDaysAgo },
        },
        _sum: { total: true },
      }),
      this.prisma.stockMovement.findMany({
        where: {
          item: { organizationId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          item: true,
          warehouse: true,
        },
      }),
    ]);

    // Get actual low stock count by comparing with reorderPoint
    const itemsWithLowStock = await this.prisma.item.findMany({
      where: {
        organizationId,
        isActive: true,
        reorderPoint: { not: null },
      },
      include: {
        stockLevels: true,
      },
    });

    const lowStockItems = itemsWithLowStock.filter((item: any) => {
      const totalStock = item.stockLevels.reduce((sum: number, sl: any) => sum + sl.onHand, 0);
      return item.reorderPoint && totalStock <= item.reorderPoint;
    }).length;

    return {
      totalItems,
      lowStockItems,
      pendingSalesOrders,
      pendingPurchaseOrders,
      monthlySales: Number(recentSales._sum.total) || 0,
      recentActivity: recentMovements.map((m: any) => ({
        id: m.id,
        type: m.movementType,
        itemCode: m.item.code,
        itemName: m.item.name,
        quantity: m.quantity,
        warehouse: m.warehouse.name,
        createdAt: m.createdAt,
      })),
    };
  }
}

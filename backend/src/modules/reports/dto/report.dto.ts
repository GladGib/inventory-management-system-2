import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoryId?: string;
}

export class SalesSummaryDto {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: {
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: {
    customerId: string;
    customerName: string;
    orderCount: number;
    totalSpent: number;
  }[];
  salesByDay: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
}

export class InventorySummaryDto {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockByCategory: {
    categoryId: string;
    categoryName: string;
    itemCount: number;
    totalValue: number;
  }[];
  stockByWarehouse: {
    warehouseId: string;
    warehouseName: string;
    itemCount: number;
    totalValue: number;
  }[];
  topSellingItems: {
    itemId: string;
    itemCode: string;
    itemName: string;
    soldQuantity: number;
  }[];
  slowMovingItems: {
    itemId: string;
    itemCode: string;
    itemName: string;
    daysSinceLastSale: number;
  }[];
}

export class PurchaseSummaryDto {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  topVendors: {
    vendorId: string;
    vendorName: string;
    orderCount: number;
    totalSpent: number;
  }[];
  purchasesByMonth: {
    month: string;
    amount: number;
    orderCount: number;
  }[];
}

export class ReceivablesSummaryDto {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  agingBuckets: {
    bucket: string;
    amount: number;
    count: number;
  }[];
  topDebtors: {
    customerId: string;
    customerName: string;
    outstanding: number;
    overdue: number;
  }[];
}

export class PayablesSummaryDto {
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  agingBuckets: {
    bucket: string;
    amount: number;
    count: number;
  }[];
  topCreditors: {
    vendorId: string;
    vendorName: string;
    outstanding: number;
    overdue: number;
  }[];
}

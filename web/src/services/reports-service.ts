import { apiClient, ApiResponse } from '@/lib/api-client';

export interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  averageOrderValue: number;
  ordersByStatus: { status: string; count: number }[];
  topProducts: { itemId: string; itemCode: string; itemName: string; quantity: number; revenue: number }[];
  topCustomers: { customerId: string; customerName: string; orderCount: number; totalSpent: number }[];
  salesByDay: { date: string; revenue: number; orderCount: number }[];
}

export interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  stockByCategory: { categoryId: string; categoryName: string; itemCount: number; totalValue: number }[];
  stockByWarehouse: { warehouseId: string; warehouseName: string; itemCount: number; totalValue: number }[];
  topSellingItems: { itemId: string; itemCode: string; itemName: string; soldQuantity: number }[];
  slowMovingItems: { itemId: string; itemCode: string; itemName: string; daysSinceLastSale: number }[];
}

export interface PurchaseSummary {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  topVendors: { vendorId: string; vendorName: string; orderCount: number; totalSpent: number }[];
  purchasesByMonth: { month: string; amount: number; orderCount: number }[];
}

export interface ReportParams {
  fromDate?: string;
  toDate?: string;
  warehouseId?: string;
}

export const reportsService = {
  getSalesSummary: async (params?: ReportParams): Promise<SalesSummary> => {
    const response = await apiClient.get<ApiResponse<SalesSummary>>('/reports/sales-summary', { params });
    return response.data.data;
  },

  getInventorySummary: async (params?: ReportParams): Promise<InventorySummary> => {
    const response = await apiClient.get<ApiResponse<InventorySummary>>('/reports/inventory-summary', { params });
    return response.data.data;
  },

  getPurchaseSummary: async (params?: ReportParams): Promise<PurchaseSummary> => {
    const response = await apiClient.get<ApiResponse<PurchaseSummary>>('/reports/purchase-summary', { params });
    return response.data.data;
  },

  exportSalesReport: async (params?: ReportParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/sales-summary/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  exportInventoryReport: async (params?: ReportParams): Promise<Blob> => {
    const response = await apiClient.get('/reports/inventory-summary/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

import { apiClient, ApiResponse } from '@/lib/api-client';

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'invoice' | 'payment' | 'grn' | 'adjustment';
  description: string;
  amount?: number;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  code: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    // For now, return mock data - will connect to backend later
    return {
      todaySales: 12500.00,
      todayOrders: 8,
      pendingOrders: 15,
      lowStockItems: 12,
      outstandingReceivables: 45000.00,
      outstandingPayables: 28000.00,
    };
  },

  getRecentActivity: async (): Promise<RecentActivity[]> => {
    return [
      { id: '1', type: 'order', description: 'Sales Order SO-00045 created', amount: 2500, createdAt: new Date().toISOString() },
      { id: '2', type: 'invoice', description: 'Invoice INV-00032 sent to ABC Trading', amount: 3200, createdAt: new Date().toISOString() },
      { id: '3', type: 'payment', description: 'Payment received from XYZ Motors', amount: 5000, createdAt: new Date().toISOString() },
      { id: '4', type: 'grn', description: 'GRN-00012 received from Auto Parts Supplier', createdAt: new Date().toISOString() },
      { id: '5', type: 'adjustment', description: 'Stock adjustment ADJ-00008 confirmed', createdAt: new Date().toISOString() },
    ];
  },

  getLowStockItems: async (): Promise<LowStockItem[]> => {
    return [
      { id: '1', code: 'BP-001', name: 'Brake Pad Set - Front', currentStock: 5, reorderPoint: 10 },
      { id: '2', code: 'OF-002', name: 'Oil Filter - Universal', currentStock: 8, reorderPoint: 20 },
      { id: '3', code: 'SP-003', name: 'Spark Plug Set', currentStock: 3, reorderPoint: 15 },
    ];
  },
};

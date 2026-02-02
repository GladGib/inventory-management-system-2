import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';
import { Customer } from './customers-service';
import { Warehouse } from './warehouses-service';

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  quantityPicked: number;
  quantityShipped: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  lineTotal: number;
  taxAmount: number;
  notes?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  customer?: Customer;
  warehouseId?: string;
  warehouseName?: string;
  warehouse?: Warehouse;
  orderDate: string;
  expectedDate?: string;
  status: SalesOrderStatus;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  internalNotes?: string;
  lines: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderLineRequest {
  itemId: string;
  quantity: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  notes?: string;
}

export interface CreateSalesOrderRequest {
  customerId: string;
  warehouseId?: string;
  orderDate?: string;
  expectedDate?: string;
  notes?: string;
  internalNotes?: string;
  discountPercent?: number;
  discountAmount?: number;
  lines: CreateSalesOrderLineRequest[];
}

export interface SalesOrdersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SalesOrderStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PickListItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  pickedQuantity: number;
  binLocation?: string;
}

export interface PickList {
  orderId: string;
  orderNumber: string;
  items: PickListItem[];
}

export const salesService = {
  getSalesOrders: async (params?: SalesOrdersListParams): Promise<ApiListResponse<SalesOrder>> => {
    const response = await apiClient.get<ApiListResponse<SalesOrder>>('/sales-orders', { params });
    return response.data;
  },

  getSalesOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
    return response.data.data;
  },

  createSalesOrder: async (data: CreateSalesOrderRequest): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>('/sales-orders', data);
    return response.data.data;
  },

  updateSalesOrder: async (id: string, data: Partial<CreateSalesOrderRequest>): Promise<SalesOrder> => {
    const response = await apiClient.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, data);
    return response.data.data;
  },

  deleteSalesOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-orders/${id}`);
  },

  confirmOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/confirm`);
    return response.data.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  getPickList: async (id: string): Promise<PickList> => {
    const response = await apiClient.get<ApiResponse<PickList>>(`/sales-orders/${id}/pick-list`);
    return response.data.data;
  },

  processPickList: async (id: string, items: { itemId: string; pickedQuantity: number }[]): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/process-pick-list`, { items });
    return response.data.data;
  },

  shipOrder: async (id: string, trackingNumber?: string): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/ship`, { trackingNumber });
    return response.data.data;
  },

  deliverOrder: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/deliver`);
    return response.data.data;
  },
};

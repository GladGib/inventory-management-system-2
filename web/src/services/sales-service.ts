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

export interface PickListLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  pickedQty: number;
  binLocationId?: string;
  binLocationCode?: string;
}

export interface PickList {
  id: string;
  pickListNo: string;
  salesOrderId: string;
  orderNumber: string;
  warehouseId: string;
  warehouseName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  assignedTo?: string;
  lines: PickListLine[];
  createdAt: string;
}

export interface ProcessPickListItem {
  lineId: string;
  pickedQty: number;
}

export type ShipmentStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED';

export interface ShipmentLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  notes?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  salesOrderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  shipDate?: string;
  deliveredDate?: string;
  notes?: string;
  lines: ShipmentLine[];
  createdAt: string;
}

export interface CreateShipmentLineRequest {
  itemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateShipmentRequest {
  carrier?: string;
  trackingNumber?: string;
  shipDate?: string;
  notes?: string;
  lines: CreateShipmentLineRequest[];
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

  createPickList: async (orderId: string): Promise<PickList> => {
    const response = await apiClient.post<ApiResponse<PickList>>(`/sales-orders/${orderId}/pick-list`);
    return response.data.data;
  },

  getPickList: async (orderId: string): Promise<PickList> => {
    const response = await apiClient.get<ApiResponse<PickList>>(`/sales-orders/${orderId}/pick-list`);
    return response.data.data;
  },

  processPickList: async (pickListId: string, items: ProcessPickListItem[]): Promise<PickList> => {
    const response = await apiClient.post<ApiResponse<PickList>>(`/pick-lists/${pickListId}/process`, { lines: items });
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

  // Shipments
  getShipments: async (orderId: string): Promise<Shipment[]> => {
    const response = await apiClient.get<ApiResponse<Shipment[]>>(`/sales-orders/${orderId}/shipments`);
    return response.data.data;
  },

  createShipment: async (orderId: string, data: CreateShipmentRequest): Promise<Shipment> => {
    const response = await apiClient.post<ApiResponse<Shipment>>(`/sales-orders/${orderId}/shipments`, data);
    return response.data.data;
  },

  getShipment: async (shipmentId: string): Promise<Shipment> => {
    const response = await apiClient.get<ApiResponse<Shipment>>(`/shipments/${shipmentId}`);
    return response.data.data;
  },

  markShipmentDelivered: async (shipmentId: string): Promise<Shipment> => {
    const response = await apiClient.post<ApiResponse<Shipment>>(`/shipments/${shipmentId}/deliver`);
    return response.data.data;
  },

  // PDF URLs
  getOrderPdfUrl: (orderId: string): string => {
    return `${apiClient.defaults.baseURL}/sales-orders/${orderId}/pdf`;
  },

  getDeliveryOrderPdfUrl: (shipmentId: string): string => {
    return `${apiClient.defaults.baseURL}/shipments/${shipmentId}/delivery-order`;
  },
};

import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';
import { Vendor } from './vendors-service';
import { Warehouse } from './warehouses-service';

export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'BILLED' | 'CLOSED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  quantityReceived: number;
  unitCost: number;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorCode?: string;
  vendorName?: string;
  vendor?: Vendor;
  warehouseId?: string;
  warehouseName?: string;
  warehouse?: Warehouse;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  internalNotes?: string;
  lines: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateGRNLineRequest {
  poLineId: string;
  quantityReceived: number;
  binLocationId?: string;
}

export interface CreateGRNRequest {
  receiveDate?: string;
  warehouseId?: string;
  notes?: string;
  lines: CreateGRNLineRequest[];
}

// Direct GRN (without PO) types
export interface CreateDirectGRNLineRequest {
  itemId: string;
  quantityReceived: number;
  unitCost: number;
  binLocationId?: string;
  notes?: string;
}

export interface CreateDirectGRNRequest {
  vendorId: string;
  warehouseId: string;
  receiveDate?: string;
  vendorInvoiceNo?: string;
  notes?: string;
  lines: CreateDirectGRNLineRequest[];
}

export type GRNStatus = 'DRAFT' | 'CONFIRMED';

export interface GRNLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQty?: number;
  quantityReceived: number;
  binLocationId?: string;
  binLocationCode?: string;
}

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber?: string;
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
  receiveDate: string;
  warehouseId?: string;
  warehouseName?: string;
  status: GRNStatus;
  notes?: string;
  lines: GRNLine[];
  createdAt: string;
}

export interface GRNSummary {
  id: string;
  grnNumber: string;
  purchaseOrderId?: string;
  poNumber?: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  warehouseId?: string;
  warehouseName?: string;
  receiveDate: string;
  status: GRNStatus;
  lineCount: number;
  createdAt: string;
}

export interface GRNListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: GRNStatus;
  vendorId?: string;
  purchaseOrderId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreatePurchaseOrderLineRequest {
  itemId: string;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface CreatePurchaseOrderRequest {
  vendorId: string;
  warehouseId?: string;
  poNumber?: string;
  orderDate?: string;
  expectedDate?: string;
  notes?: string;
  internalNotes?: string;
  lines: CreatePurchaseOrderLineRequest[];
}

export interface PurchaseOrdersListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseOrderStatus;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ReorderSuggestion {
  itemId: string;
  itemCode: string;
  itemName: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  preferredVendorId?: string;
  preferredVendorName?: string;
  lastCost?: number;
}

export const purchasesService = {
  getPurchaseOrders: async (params?: PurchaseOrdersListParams): Promise<ApiListResponse<PurchaseOrder>> => {
    const response = await apiClient.get<ApiListResponse<PurchaseOrder>>('/purchase-orders', { params });
    return response.data;
  },

  getPurchaseOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return response.data.data;
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchase-orders', data);
    return response.data.data;
  },

  updatePurchaseOrder: async (id: string, data: Partial<CreatePurchaseOrderRequest>): Promise<PurchaseOrder> => {
    const response = await apiClient.put<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`, data);
    return response.data.data;
  },

  deletePurchaseOrder: async (id: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${id}`);
  },

  sendOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/send`);
    return response.data.data;
  },

  confirmOrder: async (id: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/confirm`);
    return response.data.data;
  },

  cancelOrder: async (id: string, reason?: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`, { reason });
    return response.data.data;
  },

  createGRN: async (id: string, data: CreateGRNRequest): Promise<GoodsReceivedNote> => {
    const response = await apiClient.post<ApiResponse<GoodsReceivedNote>>(`/purchase-orders/${id}/receive`, data);
    return response.data.data;
  },

  getReorderSuggestions: async (): Promise<ReorderSuggestion[]> => {
    const response = await apiClient.get<ApiResponse<ReorderSuggestion[]>>('/purchase-orders/reorder-suggestions');
    return response.data.data;
  },

  // GRN endpoints
  getGRNs: async (params?: GRNListParams): Promise<ApiListResponse<GRNSummary>> => {
    const response = await apiClient.get<ApiListResponse<GRNSummary>>('/purchase-orders/grn', { params });
    return response.data;
  },

  getGRN: async (id: string): Promise<GoodsReceivedNote> => {
    const response = await apiClient.get<ApiResponse<GoodsReceivedNote>>(`/purchase-orders/grn/${id}`);
    return response.data.data;
  },

  // Direct GRN creation (without PO)
  createDirectGRN: async (data: CreateDirectGRNRequest): Promise<GoodsReceivedNote> => {
    const response = await apiClient.post<ApiResponse<GoodsReceivedNote>>('/grns', data);
    return response.data.data;
  },

  // Download GRN PDF
  downloadGRNPdf: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/grns/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get open (receivable) purchase orders for GRN creation
  getOpenPurchaseOrders: async (vendorId?: string): Promise<ApiListResponse<PurchaseOrder>> => {
    const response = await apiClient.get<ApiListResponse<PurchaseOrder>>('/purchase-orders', {
      params: {
        status: 'ISSUED,PARTIALLY_RECEIVED',
        vendorId,
        limit: 100,
      },
    });
    return response.data;
  },

  sendEmail: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/purchase-orders/${id}/send-email`);
    return response.data.data;
  },
};

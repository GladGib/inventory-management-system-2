import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export type AdjustmentType = 'ADD' | 'SUBTRACT' | 'DAMAGE' | 'THEFT' | 'CORRECTION' | 'OTHER';
export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
export type StockCountStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouseName?: string;
  adjustmentType: AdjustmentType;
  adjustmentDate: string;
  status: string;
  reason?: string;
  notes?: string;
  lines: StockAdjustmentItem[];
  createdAt: string;
}

export interface StockAdjustmentItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  binLocationId?: string;
  binLocationCode?: string;
  notes?: string;
}

export interface CreateAdjustmentLineRequest {
  itemId: string;
  quantity: number;
  binLocationId?: string;
  notes?: string;
}

export interface CreateStockAdjustmentRequest {
  warehouseId: string;
  adjustmentType: AdjustmentType;
  adjustmentDate?: string;
  reason?: string;
  lines: CreateAdjustmentLineRequest[];
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName?: string;
  toWarehouseId: string;
  toWarehouseName?: string;
  transferDate: string;
  status: TransferStatus;
  notes?: string;
  lines: StockTransferItem[];
  createdAt: string;
}

export interface StockTransferItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  fromBinLocationId?: string;
  toBinLocationId?: string;
}

export interface TransferLineRequest {
  itemId: string;
  quantity: number;
  fromBinLocationId?: string;
  toBinLocationId?: string;
}

export interface CreateStockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate?: string;
  notes?: string;
  lines: TransferLineRequest[];
}

export interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName?: string;
  countDate: string;
  status: StockCountStatus;
  notes?: string;
  lines: StockCountItem[];
  createdAt: string;
  completedAt?: string;
}

export interface StockCountItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  systemQty: number;
  countedQty: number | null;
  variance: number | null;
}

export interface CreateStockCountRequest {
  warehouseId: string;
  countDate?: string;
  itemIds?: string[];
  notes?: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  movementType: string;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  notes?: string;
  createdAt: string;
}

export interface StockMovementsParams {
  page?: number;
  limit?: number;
  itemId?: string;
  warehouseId?: string;
  movementType?: string;
  fromDate?: string;
  toDate?: string;
}

export const inventoryService = {
  // Stock Adjustments
  getStockAdjustments: async (params?: { page?: number; limit?: number; warehouseId?: string; type?: AdjustmentType }): Promise<ApiListResponse<StockAdjustment>> => {
    const response = await apiClient.get<ApiListResponse<StockAdjustment>>('/stock-adjustments', { params });
    return response.data;
  },

  getStockAdjustment: async (id: string): Promise<StockAdjustment> => {
    const response = await apiClient.get<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}`);
    return response.data.data;
  },

  createStockAdjustment: async (data: CreateStockAdjustmentRequest): Promise<StockAdjustment> => {
    const response = await apiClient.post<ApiResponse<StockAdjustment>>('/stock-adjustments', data);
    return response.data.data;
  },

  confirmStockAdjustment: async (id: string): Promise<StockAdjustment> => {
    const response = await apiClient.post<ApiResponse<StockAdjustment>>(`/stock-adjustments/${id}/confirm`);
    return response.data.data;
  },

  // Stock Transfers
  getStockTransfers: async (params?: { page?: number; limit?: number; status?: TransferStatus }): Promise<ApiListResponse<StockTransfer>> => {
    const response = await apiClient.get<ApiListResponse<StockTransfer>>('/stock-transfers', { params });
    return response.data;
  },

  getStockTransfer: async (id: string): Promise<StockTransfer> => {
    const response = await apiClient.get<ApiResponse<StockTransfer>>(`/stock-transfers/${id}`);
    return response.data.data;
  },

  createStockTransfer: async (data: CreateStockTransferRequest): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>('/stock-transfers', data);
    return response.data.data;
  },

  confirmTransfer: async (id: string): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/confirm`);
    return response.data.data;
  },

  shipTransfer: async (id: string): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/ship`);
    return response.data.data;
  },

  completeTransfer: async (id: string): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/complete`);
    return response.data.data;
  },

  receiveTransfer: async (id: string, items: { itemId: string; receivedQuantity: number }[]): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/receive`, { items });
    return response.data.data;
  },

  cancelTransfer: async (id: string): Promise<StockTransfer> => {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(`/stock-transfers/${id}/cancel`);
    return response.data.data;
  },

  // Stock Counts
  getStockCounts: async (params?: { page?: number; limit?: number; status?: StockCountStatus }): Promise<ApiListResponse<StockCount>> => {
    const response = await apiClient.get<ApiListResponse<StockCount>>('/stock-counts', { params });
    return response.data;
  },

  getStockCount: async (id: string): Promise<StockCount> => {
    const response = await apiClient.get<ApiResponse<StockCount>>(`/stock-counts/${id}`);
    return response.data.data;
  },

  createStockCount: async (data: CreateStockCountRequest): Promise<StockCount> => {
    const response = await apiClient.post<ApiResponse<StockCount>>('/stock-counts', data);
    return response.data.data;
  },

  recordStockCount: async (countId: string, entries: { itemId: string; countedQty: number }[]): Promise<StockCount> => {
    const response = await apiClient.post<ApiResponse<StockCount>>(`/stock-counts/${countId}/record`, entries);
    return response.data.data;
  },

  completeStockCount: async (id: string, createAdjustment: boolean = true): Promise<StockCount> => {
    const response = await apiClient.post<ApiResponse<StockCount>>(`/stock-counts/${id}/complete`, undefined, {
      params: { createAdjustment },
    });
    return response.data.data;
  },

  // Stock Movements
  getStockMovements: async (params?: StockMovementsParams): Promise<ApiListResponse<StockMovement>> => {
    const response = await apiClient.get<ApiListResponse<StockMovement>>('/stock-movements', { params });
    return response.data;
  },
};

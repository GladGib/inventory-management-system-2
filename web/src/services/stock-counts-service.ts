import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export type StockCountStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface StockCountLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  systemQty: number;
  countedQty: number | null;
  variance: number | null;
}

export interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  countDate: string;
  status: StockCountStatus;
  notes?: string;
  lines: StockCountLine[];
  createdAt: string;
  completedAt?: string;
}

export interface CreateStockCountRequest {
  warehouseId: string;
  countDate?: string;
  itemIds?: string[];
  notes?: string;
}

export interface RecordCountRequest {
  lineId: string;
  countedQty: number;
}

export interface StockCountListParams {
  page?: number;
  limit?: number;
  warehouseId?: string;
  status?: StockCountStatus;
}

export const stockCountsService = {
  getStockCounts: async (params?: StockCountListParams): Promise<ApiListResponse<StockCount>> => {
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

  recordCount: async (id: string, entries: RecordCountRequest[]): Promise<StockCount> => {
    const response = await apiClient.post<ApiResponse<StockCount>>(`/stock-counts/${id}/record`, entries);
    return response.data.data;
  },

  completeStockCount: async (id: string, createAdjustment: boolean = true): Promise<StockCount> => {
    const response = await apiClient.post<ApiResponse<StockCount>>(
      `/stock-counts/${id}/complete`,
      null,
      { params: { createAdjustment } }
    );
    return response.data.data;
  },
};

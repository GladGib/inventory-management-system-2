import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export interface BinLocation {
  id: string;
  code: string;
  name: string;
  description?: string;
  warehouseId: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  isActive: boolean;
  currentStock?: number;
  _count?: {
    stockLevels: number;
  };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  binLocations?: BinLocation[];
  _count?: {
    binLocations: number;
  };
}

export interface CreateWarehouseRequest {
  code?: string;
  name: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface CreateBinLocationRequest {
  code: string;
  name: string;
  description?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  isActive?: boolean;
}

export interface BinStockLevel {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  binLocationId: string;
  binLocationCode: string;
  warehouseId: string;
  warehouseName: string;
}

export interface WarehousesListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface StockSummary {
  warehouseId: string;
  warehouseName: string;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
}

export interface WarehouseStockLevel {
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  binLocationId?: string;
  binLocationCode?: string;
  onHand: number;
  committed: number;
  available: number;
  onOrder: number;
  reorderPoint?: number;
  isLowStock: boolean;
}

export interface StockLevelsParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStockOnly?: boolean;
  binLocationId?: string;
}

export const warehousesService = {
  getWarehouses: async (params?: WarehousesListParams): Promise<ApiListResponse<Warehouse>> => {
    const response = await apiClient.get<ApiListResponse<Warehouse>>('/warehouses', { params });
    return response.data;
  },

  getWarehouse: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return response.data.data;
  },

  createWarehouse: async (data: CreateWarehouseRequest): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', data);
    return response.data.data;
  },

  updateWarehouse: async (id: string, data: Partial<CreateWarehouseRequest>): Promise<Warehouse> => {
    const response = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return response.data.data;
  },

  deleteWarehouse: async (id: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  },

  setPrimary: async (id: string): Promise<Warehouse> => {
    const response = await apiClient.post<ApiResponse<Warehouse>>(`/warehouses/${id}/set-primary`);
    return response.data.data;
  },

  getStockSummary: async (id: string): Promise<StockSummary> => {
    const response = await apiClient.get<ApiResponse<StockSummary>>(`/warehouses/${id}/summary`);
    return response.data.data;
  },

  getStockLevels: async (id: string, params?: StockLevelsParams): Promise<ApiListResponse<WarehouseStockLevel>> => {
    const response = await apiClient.get<ApiListResponse<WarehouseStockLevel>>(`/warehouses/${id}/stock`, { params });
    return response.data;
  },

  // Bin Locations
  getBinLocations: async (warehouseId: string): Promise<BinLocation[]> => {
    const response = await apiClient.get<ApiResponse<BinLocation[]>>(`/warehouses/${warehouseId}/bins`);
    return response.data.data;
  },

  createBinLocation: async (warehouseId: string, data: CreateBinLocationRequest): Promise<BinLocation> => {
    const response = await apiClient.post<ApiResponse<BinLocation>>(`/warehouses/${warehouseId}/bins`, data);
    return response.data.data;
  },

  updateBinLocation: async (warehouseId: string, binId: string, data: Partial<CreateBinLocationRequest>): Promise<BinLocation> => {
    const response = await apiClient.put<ApiResponse<BinLocation>>(`/warehouses/${warehouseId}/bins/${binId}`, data);
    return response.data.data;
  },

  deleteBinLocation: async (warehouseId: string, binId: string): Promise<void> => {
    await apiClient.delete(`/warehouses/${warehouseId}/bins/${binId}`);
  },

  getBinLocation: async (warehouseId: string, binId: string): Promise<BinLocation> => {
    const response = await apiClient.get<ApiResponse<BinLocation>>(`/warehouses/${warehouseId}/bins/${binId}`);
    return response.data.data;
  },

  // Stock by Bin
  getStockByBin: async (params?: { warehouseId?: string; search?: string; page?: number; limit?: number }): Promise<ApiListResponse<BinStockLevel>> => {
    const response = await apiClient.get<ApiListResponse<BinStockLevel>>('/stock-by-bin', { params });
    return response.data;
  },

  getBinStock: async (warehouseId: string, binId: string): Promise<BinStockLevel[]> => {
    const response = await apiClient.get<ApiResponse<BinStockLevel[]>>(`/warehouses/${warehouseId}/bins/${binId}/stock`);
    return response.data.data;
  },

  deactivateBinLocation: async (warehouseId: string, binId: string): Promise<BinLocation> => {
    const response = await apiClient.put<ApiResponse<BinLocation>>(`/warehouses/${warehouseId}/bins/${binId}`, { isActive: false });
    return response.data.data;
  },
};

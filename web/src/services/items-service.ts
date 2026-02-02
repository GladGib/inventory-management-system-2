import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export interface Item {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'SIMPLE' | 'VARIANT_PARENT' | 'VARIANT' | 'BUNDLE';
  categoryId?: string;
  categoryName?: string;
  taxRateId?: string;
  taxRateName?: string;
  uom: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minSellingPrice?: number;
  trackInventory: boolean;
  reorderPoint?: number;
  reorderQty?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemRequest {
  code?: string;
  name: string;
  description?: string;
  type?: string;
  categoryId?: string;
  taxRateId?: string;
  uom: string;
  barcode?: string;
  costPrice?: number;
  sellingPrice: number;
  wholesalePrice?: number;
  minSellingPrice?: number;
  trackInventory?: boolean;
  reorderPoint?: number;
  reorderQty?: number;
  isActive?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  level: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentId?: string;
}

export interface ItemsListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  type?: string;
}

export const itemsService = {
  // Items
  getItems: async (params?: ItemsListParams): Promise<ApiListResponse<Item>> => {
    const response = await apiClient.get<ApiListResponse<Item>>('/items', { params });
    return response.data;
  },

  getItem: async (id: string): Promise<Item> => {
    const response = await apiClient.get<ApiResponse<Item>>(`/items/${id}`);
    return response.data.data;
  },

  getItemByBarcode: async (barcode: string): Promise<Item> => {
    const response = await apiClient.get<ApiResponse<Item>>(`/items/barcode/${barcode}`);
    return response.data.data;
  },

  createItem: async (data: CreateItemRequest): Promise<Item> => {
    const response = await apiClient.post<ApiResponse<Item>>('/items', data);
    return response.data.data;
  },

  updateItem: async (id: string, data: Partial<CreateItemRequest>): Promise<Item> => {
    const response = await apiClient.put<ApiResponse<Item>>(`/items/${id}`, data);
    return response.data.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/items/${id}`);
  },

  // Categories
  getCategories: async (tree?: boolean): Promise<Category[]> => {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: { tree },
    });
    return response.data.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  updateCategory: async (id: string, data: Partial<CreateCategoryRequest>): Promise<Category> => {
    const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

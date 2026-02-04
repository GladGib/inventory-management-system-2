import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  paymentTerms: number;
  balance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  code?: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  paymentTerms?: number;
  notes?: string;
  isActive?: boolean;
}

export interface VendorsListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const vendorsService = {
  getVendors: async (params?: VendorsListParams): Promise<ApiListResponse<Vendor>> => {
    const response = await apiClient.get<ApiListResponse<Vendor>>('/vendors', { params });
    return response.data;
  },

  getVendor: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return response.data.data;
  },

  createVendor: async (data: CreateVendorRequest): Promise<Vendor> => {
    const response = await apiClient.post<ApiResponse<Vendor>>('/vendors', data);
    return response.data.data;
  },

  updateVendor: async (id: string, data: Partial<CreateVendorRequest>): Promise<Vendor> => {
    const response = await apiClient.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
    return response.data.data;
  },

  deleteVendor: async (id: string): Promise<void> => {
    await apiClient.delete(`/vendors/${id}`);
  },

  getVendorItems: async (id: string): Promise<VendorItem[]> => {
    const response = await apiClient.get<ApiResponse<VendorItem[]>>(`/vendors/${id}/items`);
    return response.data.data;
  },

  addVendorItem: async (vendorId: string, data: CreateVendorItemRequest): Promise<VendorItem> => {
    const response = await apiClient.post<ApiResponse<VendorItem>>(`/vendors/${vendorId}/items`, data);
    return response.data.data;
  },

  updateVendorItem: async (vendorId: string, itemId: string, data: UpdateVendorItemRequest): Promise<VendorItem> => {
    const response = await apiClient.put<ApiResponse<VendorItem>>(`/vendors/${vendorId}/items/${itemId}`, data);
    return response.data.data;
  },

  removeVendorItem: async (vendorId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/vendors/${vendorId}/items/${itemId}`);
  },

  getTransactionHistory: async (id: string, params?: VendorTransactionsParams): Promise<ApiListResponse<VendorTransaction>> => {
    const response = await apiClient.get<ApiListResponse<VendorTransaction>>(`/vendors/${id}/transactions`, { params });
    return response.data;
  },
};

export interface VendorItem {
  id: string;
  vendorId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  vendorSku?: string;
  unitCost?: number;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPreferred: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorItemRequest {
  itemId: string;
  vendorSku?: string;
  unitCost?: number;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPreferred?: boolean;
  notes?: string;
}

export interface UpdateVendorItemRequest {
  vendorSku?: string;
  unitCost?: number;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPreferred?: boolean;
  notes?: string;
}

export interface VendorTransaction {
  id: string;
  type: 'PO' | 'GRN' | 'BILL' | 'PAYMENT';
  documentNumber: string;
  documentDate: string;
  amount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface VendorTransactionsParams {
  page?: number;
  limit?: number;
  type?: 'PO' | 'GRN' | 'BILL' | 'PAYMENT';
  fromDate?: string;
  toDate?: string;
}

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
};

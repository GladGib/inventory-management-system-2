import { apiClient, ApiResponse } from '@/lib/api-client';

export interface Organization {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  currency: string;
  taxRate: number;
  defaultPaymentTerms: number;
  autoGenerateCodes: boolean;
  allowNegativeStock: boolean;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  phone?: string;
  address?: string;
  currency?: string;
  taxRate?: number;
  defaultPaymentTerms?: number;
  autoGenerateCodes?: boolean;
  allowNegativeStock?: boolean;
}

export const organizationsService = {
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await apiClient.get<ApiResponse<Organization>>(`/organizations/${id}`);
    return response.data.data;
  },

  updateOrganization: async (
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<Organization> => {
    const response = await apiClient.put<ApiResponse<Organization>>(
      `/organizations/${id}`,
      data
    );
    return response.data.data;
  },

  uploadLogo: async (id: string, file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<{ logoUrl: string }>>(
      `/organizations/${id}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  getLogoUrl: (id: string): string => {
    return `/api/v1/organizations/${id}/logo`;
  },

  deleteLogo: async (id: string): Promise<void> => {
    await apiClient.delete(`/organizations/${id}/logo`);
  },
};

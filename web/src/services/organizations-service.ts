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

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRateRequest {
  name: string;
  rate: number;
  isActive?: boolean;
}

export interface UpdateTaxRateRequest {
  name?: string;
  rate?: number;
  isActive?: boolean;
}

export interface NumberSequence {
  id: string;
  documentType: string;
  prefix: string;
  currentNumber: number;
  resetMonthly: boolean;
  lastResetDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateNumberSequenceRequest {
  prefix?: string;
  resetMonthly?: boolean;
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

  // Tax Rates
  getTaxRates: async (): Promise<TaxRate[]> => {
    const response = await apiClient.get<ApiResponse<TaxRate[]>>('/settings/tax-rates');
    return response.data.data;
  },

  createTaxRate: async (data: CreateTaxRateRequest): Promise<TaxRate> => {
    const response = await apiClient.post<ApiResponse<TaxRate>>('/settings/tax-rates', data);
    return response.data.data;
  },

  updateTaxRate: async (id: string, data: UpdateTaxRateRequest): Promise<TaxRate> => {
    const response = await apiClient.put<ApiResponse<TaxRate>>(`/settings/tax-rates/${id}`, data);
    return response.data.data;
  },

  deleteTaxRate: async (id: string): Promise<void> => {
    await apiClient.delete(`/settings/tax-rates/${id}`);
  },

  // Number Sequences
  getNumberSequences: async (): Promise<NumberSequence[]> => {
    const response = await apiClient.get<ApiResponse<NumberSequence[]>>('/settings/number-sequences');
    return response.data.data;
  },

  updateNumberSequence: async (
    documentType: string,
    data: UpdateNumberSequenceRequest
  ): Promise<NumberSequence> => {
    const response = await apiClient.put<ApiResponse<NumberSequence>>(
      `/settings/number-sequences/${documentType}`,
      data
    );
    return response.data.data;
  },
};

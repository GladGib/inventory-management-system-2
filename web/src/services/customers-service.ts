import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export interface CustomerAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerContact {
  id: string;
  name: string;
  designation?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  paymentTerms: number;
  creditLimit: number;
  balance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
}

export interface CreateCustomerRequest {
  code?: string;
  name: string;
  displayName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  paymentTerms?: number;
  creditLimit?: number;
  notes?: string;
  isActive?: boolean;
}

export interface CustomersListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const customersService = {
  getCustomers: async (params?: CustomersListParams): Promise<ApiListResponse<Customer>> => {
    const response = await apiClient.get<ApiListResponse<Customer>>('/customers', { params });
    return response.data;
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<ApiResponse<Customer>>('/customers', data);
    return response.data.data;
  },

  updateCustomer: async (id: string, data: Partial<CreateCustomerRequest>): Promise<Customer> => {
    const response = await apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data.data;
  },

  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  getCreditInfo: async (id: string): Promise<{
    creditLimit: number;
    currentBalance: number;
    totalOutstanding: number;
    availableCredit: number;
  }> => {
    const response = await apiClient.get(`/customers/${id}/credit`);
    return response.data.data;
  },
};

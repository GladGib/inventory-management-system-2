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

  getAddresses: async (id: string): Promise<CustomerAddress[]> => {
    const response = await apiClient.get<ApiResponse<CustomerAddress[]>>(`/customers/${id}/addresses`);
    return response.data.data;
  },

  addAddress: async (customerId: string, data: CreateAddressRequest): Promise<CustomerAddress> => {
    const response = await apiClient.post<ApiResponse<CustomerAddress>>(`/customers/${customerId}/addresses`, data);
    return response.data.data;
  },

  updateAddress: async (customerId: string, addressId: string, data: UpdateAddressRequest): Promise<CustomerAddress> => {
    const response = await apiClient.put<ApiResponse<CustomerAddress>>(`/customers/${customerId}/addresses/${addressId}`, data);
    return response.data.data;
  },

  deleteAddress: async (customerId: string, addressId: string): Promise<void> => {
    await apiClient.delete(`/customers/${customerId}/addresses/${addressId}`);
  },

  setDefaultAddress: async (customerId: string, addressId: string): Promise<CustomerAddress> => {
    const response = await apiClient.post<ApiResponse<CustomerAddress>>(`/customers/${customerId}/addresses/${addressId}/set-default`);
    return response.data.data;
  },

  getTransactionHistory: async (id: string, params?: CustomerTransactionsParams): Promise<ApiListResponse<CustomerTransaction>> => {
    const response = await apiClient.get<ApiListResponse<CustomerTransaction>>(`/customers/${id}/transactions`, { params });
    return response.data;
  },

  getStatement: async (id: string, params: StatementParams): Promise<CustomerStatement> => {
    const response = await apiClient.get<ApiResponse<CustomerStatement>>(`/customers/${id}/statement`, { params });
    return response.data.data;
  },

  getStatementPdfUrl: (id: string, fromDate: string, toDate: string): string => {
    return `/customers/${id}/statement/pdf?fromDate=${fromDate}&toDate=${toDate}`;
  },
};

export interface CreateAddressRequest {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CustomerTransaction {
  id: string;
  type: 'ORDER' | 'INVOICE' | 'PAYMENT' | 'RETURN';
  documentNumber: string;
  documentDate: string;
  amount: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface CustomerTransactionsParams {
  page?: number;
  limit?: number;
  type?: 'ORDER' | 'INVOICE' | 'PAYMENT' | 'RETURN';
  fromDate?: string;
  toDate?: string;
}

export interface StatementParams {
  fromDate: string;
  toDate: string;
}

export interface StatementLine {
  date: string;
  documentNumber: string;
  documentType: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerCode: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  lines: StatementLine[];
}

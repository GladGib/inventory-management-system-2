import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';
import { Customer } from './customers-service';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOIDED';

export interface InvoiceItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  lineTotal: number;
  taxAmount: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  customer?: Customer;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  lines: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceLineRequest {
  itemId: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
}

export interface CreateInvoiceRequest {
  customerId: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentTerms?: number;
  discountPercent?: number;
  discountAmount?: number;
  notes?: string;
  lines: CreateInvoiceLineRequest[];
}

export interface CreateInvoiceFromOrderRequest {
  salesOrderId: string;
  invoiceDate?: string;
  paymentTerms?: number;
  notes?: string;
}

export interface RecordPaymentRequest {
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface InvoicesListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface PaymentReceived {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentsReceivedListParams {
  page?: number;
  limit?: number;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export const invoicesService = {
  getInvoices: async (params?: InvoicesListParams): Promise<ApiListResponse<Invoice>> => {
    const response = await apiClient.get<ApiListResponse<Invoice>>('/invoices', { params });
    return response.data;
  },

  getInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data.data;
  },

  createInvoice: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/invoices', data);
    return response.data.data;
  },

  createFromSalesOrder: async (data: CreateInvoiceFromOrderRequest): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/invoices/from-order', data);
    return response.data.data;
  },

  updateInvoice: async (id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> => {
    const response = await apiClient.put<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return response.data.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  sendInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/send`);
    return response.data.data;
  },

  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/payments`, data);
    return response.data.data;
  },

  voidInvoice: async (id: string): Promise<Invoice> => {
    const response = await apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/void`);
    return response.data.data;
  },

  getPayments: async (id: string): Promise<Payment[]> => {
    const response = await apiClient.get<ApiResponse<Payment[]>>(`/invoices/${id}/payments`);
    return response.data.data;
  },

  getInvoicePdfUrl: (id: string): string => {
    return `/invoices/${id}/pdf`;
  },
};

export const paymentsReceivedService = {
  getPaymentsReceived: async (params?: PaymentsReceivedListParams): Promise<ApiListResponse<PaymentReceived>> => {
    const response = await apiClient.get<ApiListResponse<PaymentReceived>>('/payments-received', { params });
    return response.data;
  },
};

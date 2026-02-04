import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export type BillStatus = 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'VOID';

export interface BillLine {
  id: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  lineTotal: number;
}

export interface BillPayment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorCode?: string;
  vendorName?: string;
  grnId?: string;
  grnNumber?: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  status: BillStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  lines: BillLine[];
  payments: BillPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface BillSummary {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  status: BillStatus;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  lineCount: number;
}

export interface BillListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BillStatus;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateBillItemRequest {
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
}

export interface CreateBillRequest {
  vendorId: string;
  grnId?: string;
  vendorInvoiceNumber?: string;
  billDate?: string;
  dueDate?: string;
  discountAmount?: number;
  notes?: string;
  items: CreateBillItemRequest[];
}

export interface RecordPaymentRequest {
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentSummary {
  totalBills: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  pendingAmount: number;
}

export interface UnbilledGRN {
  id: string;
  grnNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  receiveDate: string;
  poNumber?: string;
  lineCount: number;
  estimatedTotal: number;
}

export interface UnbilledGRNsParams {
  vendorId?: string;
  limit?: number;
}

export interface CreateConsolidatedBillRequest {
  vendorId: string;
  grnIds: string[];
  vendorInvoiceNumber?: string;
  billDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface VendorPayment {
  id: string;
  billId: string;
  billNumber: string;
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface VendorPaymentsListParams {
  page?: number;
  limit?: number;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export const billsService = {
  getBills: async (params?: BillListParams): Promise<ApiListResponse<BillSummary>> => {
    const response = await apiClient.get<ApiListResponse<BillSummary>>('/bills', { params });
    return response.data;
  },

  getBill: async (id: string): Promise<Bill> => {
    const response = await apiClient.get<ApiResponse<Bill>>(`/bills/${id}`);
    return response.data.data;
  },

  createBill: async (data: CreateBillRequest): Promise<Bill> => {
    const response = await apiClient.post<ApiResponse<Bill>>('/bills', data);
    return response.data.data;
  },

  createFromGRN: async (grnId: string): Promise<Bill> => {
    const response = await apiClient.post<ApiResponse<Bill>>('/bills/from-grn', { grnId });
    return response.data.data;
  },

  updateBill: async (id: string, data: Partial<CreateBillRequest>): Promise<Bill> => {
    const response = await apiClient.put<ApiResponse<Bill>>(`/bills/${id}`, data);
    return response.data.data;
  },

  deleteBill: async (id: string): Promise<void> => {
    await apiClient.delete(`/bills/${id}`);
  },

  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<Bill> => {
    const response = await apiClient.post<ApiResponse<Bill>>(`/bills/${id}/payments`, data);
    return response.data.data;
  },

  voidBill: async (id: string): Promise<Bill> => {
    const response = await apiClient.post<ApiResponse<Bill>>(`/bills/${id}/void`);
    return response.data.data;
  },

  getPaymentSummary: async (vendorId?: string): Promise<PaymentSummary> => {
    const params = vendorId ? { vendorId } : {};
    const response = await apiClient.get<ApiResponse<PaymentSummary>>('/bills/payment-summary', { params });
    return response.data.data;
  },

  getUnbilledGRNs: async (params?: UnbilledGRNsParams): Promise<UnbilledGRN[]> => {
    const response = await apiClient.get<ApiResponse<UnbilledGRN[]>>('/bills/unbilled-grns', { params });
    return response.data.data;
  },

  createConsolidatedBill: async (data: CreateConsolidatedBillRequest): Promise<Bill> => {
    const response = await apiClient.post<ApiResponse<Bill>>('/bills/consolidated', data);
    return response.data.data;
  },
};

export const vendorPaymentsService = {
  getVendorPayments: async (params?: VendorPaymentsListParams): Promise<ApiListResponse<VendorPayment>> => {
    const response = await apiClient.get<ApiListResponse<VendorPayment>>('/vendor-payments', { params });
    return response.data;
  },
};

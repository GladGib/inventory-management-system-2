import { apiClient, ApiResponse, ApiListResponse } from '@/lib/api-client';

export type ReturnStatus = 'DRAFT' | 'PENDING_INSPECTION' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
export type ReturnReason = 'DEFECTIVE' | 'WRONG_ITEM' | 'DAMAGED' | 'NOT_AS_DESCRIBED' | 'CUSTOMER_CHANGED_MIND' | 'OTHER';

export interface SalesReturnLine {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  lineTotal: number;
  reason?: ReturnReason;
  condition?: string;
  restockable?: boolean;
  notes?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerId: string;
  customerCode?: string;
  customerName?: string;
  returnDate: string;
  status: ReturnStatus;
  reason?: ReturnReason;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  refundAmount?: number;
  refundMethod?: string;
  refundReference?: string;
  notes?: string;
  lines: SalesReturnLine[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesReturnSummary {
  id: string;
  returnNumber: string;
  invoiceNumber?: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  returnDate: string;
  status: ReturnStatus;
  reason?: ReturnReason;
  totalAmount: number;
  lineCount: number;
}

export interface SalesReturnListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReturnStatus;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CreateReturnItemRequest {
  itemId: string;
  quantity: number;
  reason?: ReturnReason;
  notes?: string;
}

export interface CreateSalesReturnRequest {
  invoiceId: string;
  returnDate?: string;
  reason?: ReturnReason;
  notes?: string;
  items: CreateReturnItemRequest[];
}

export interface ReceiveReturnRequest {
  items: {
    itemId: string;
    receivedQuantity: number;
    condition?: string;
    restockable?: boolean;
  }[];
  warehouseId?: string;
  notes?: string;
}

export interface ProcessRefundRequest {
  refundAmount: number;
  refundMethod: string;
  referenceNumber?: string;
  notes?: string;
}

export const salesReturnsService = {
  getReturns: async (params?: SalesReturnListParams): Promise<ApiListResponse<SalesReturnSummary>> => {
    const response = await apiClient.get<ApiListResponse<SalesReturnSummary>>('/sales-returns', { params });
    return response.data;
  },

  getReturn: async (id: string): Promise<SalesReturn> => {
    const response = await apiClient.get<ApiResponse<SalesReturn>>(`/sales-returns/${id}`);
    return response.data.data;
  },

  createReturn: async (data: CreateSalesReturnRequest): Promise<SalesReturn> => {
    const response = await apiClient.post<ApiResponse<SalesReturn>>('/sales-returns', data);
    return response.data.data;
  },

  updateReturn: async (id: string, data: Partial<CreateSalesReturnRequest>): Promise<SalesReturn> => {
    const response = await apiClient.put<ApiResponse<SalesReturn>>(`/sales-returns/${id}`, data);
    return response.data.data;
  },

  deleteReturn: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales-returns/${id}`);
  },

  approveReturn: async (id: string): Promise<SalesReturn> => {
    const response = await apiClient.post<ApiResponse<SalesReturn>>(`/sales-returns/${id}/approve`);
    return response.data.data;
  },

  rejectReturn: async (id: string, reason?: string): Promise<SalesReturn> => {
    const response = await apiClient.post<ApiResponse<SalesReturn>>(`/sales-returns/${id}/reject`, { reason });
    return response.data.data;
  },

  receiveReturn: async (id: string, data: ReceiveReturnRequest): Promise<SalesReturn> => {
    const response = await apiClient.post<ApiResponse<SalesReturn>>(`/sales-returns/${id}/receive`, data);
    return response.data.data;
  },

  processRefund: async (id: string, data: ProcessRefundRequest): Promise<SalesReturn> => {
    const response = await apiClient.post<ApiResponse<SalesReturn>>(`/sales-returns/${id}/refund`, data);
    return response.data.data;
  },
};

export const returnReasonLabels: Record<ReturnReason, string> = {
  DEFECTIVE: 'Defective',
  WRONG_ITEM: 'Wrong Item',
  DAMAGED: 'Damaged',
  NOT_AS_DESCRIBED: 'Not as Described',
  CUSTOMER_CHANGED_MIND: 'Customer Changed Mind',
  OTHER: 'Other',
};

export const returnStatusLabels: Record<ReturnStatus, string> = {
  DRAFT: 'Draft',
  PENDING_INSPECTION: 'Pending Inspection',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const returnStatusColors: Record<ReturnStatus, string> = {
  DRAFT: 'default',
  PENDING_INSPECTION: 'blue',
  APPROVED: 'cyan',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

import { apiClient, ApiResponse } from '@/lib/api-client';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  validRows: number;
  totalRows: number;
  errors: ValidationError[];
  preview: Record<string, any>[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ValidationError[];
}

export type BulkEntityType = 'items' | 'customers' | 'vendors';

export const bulkImportService = {
  // Download CSV template
  downloadTemplate: (entityType: BulkEntityType): string => {
    return `${apiClient.defaults.baseURL}/bulk/${entityType}/template`;
  },

  // Validate CSV file
  validateFile: async (
    entityType: BulkEntityType,
    file: File
  ): Promise<ValidationResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      `/bulk/${entityType}/validate`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  // Import CSV file
  importFile: async (
    entityType: BulkEntityType,
    file: File,
    skipErrors = false
  ): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (skipErrors) {
      formData.append('skipErrors', 'true');
    }

    const response = await apiClient.post<ApiResponse<ImportResult>>(
      `/bulk/${entityType}/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },
};

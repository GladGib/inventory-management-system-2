'use client';

import { useState } from 'react';
import { Button, Space, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

export interface ExportButtonsProps {
  /** Base endpoint for the export (e.g., '/reports/stock-valuation/export') */
  exportEndpoint: string;
  /** Current filter parameters to pass to the export */
  params?: Record<string, string | number | undefined>;
  /** Base filename for downloads (without extension) */
  filename?: string;
  /** Show PDF button (default: true) */
  showPdf?: boolean;
  /** Show Excel button (default: true) */
  showExcel?: boolean;
}

type ExportFormat = 'pdf' | 'excel';

export function ExportButtons({
  exportEndpoint,
  params = {},
  filename = 'report',
  showPdf = true,
  showExcel = true,
}: ExportButtonsProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    const setLoading = format === 'pdf' ? setLoadingPdf : setLoadingExcel;
    setLoading(true);

    try {
      // Filter out undefined params
      const cleanParams: Record<string, string | number> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });

      const response = await apiClient.get(exportEndpoint, {
        params: {
          ...cleanParams,
          format,
        },
        responseType: 'blob',
      });

      // Determine file extension based on format
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      // Create blob and download
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`${format.toUpperCase()} exported successfully`);
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to export report';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      {showPdf && (
        <Button
          icon={<FilePdfOutlined />}
          loading={loadingPdf}
          onClick={() => handleExport('pdf')}
        >
          Export PDF
        </Button>
      )}
      {showExcel && (
        <Button
          icon={<FileExcelOutlined />}
          loading={loadingExcel}
          onClick={() => handleExport('excel')}
        >
          Export Excel
        </Button>
      )}
    </Space>
  );
}

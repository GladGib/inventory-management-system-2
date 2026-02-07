'use client';

import { useState } from 'react';
import {
  Modal,
  Steps,
  Button,
  Upload,
  Table,
  Alert,
  Space,
  Progress,
  Result,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  bulkImportService,
  BulkEntityType,
  ValidationResult,
  ImportResult,
  ValidationError,
} from '@/services/bulk-import-service';

const { Text, Title } = Typography;
const { Dragger } = Upload;

interface BulkImportWizardProps {
  entityType: BulkEntityType;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportWizard({
  entityType,
  open,
  onClose,
  onSuccess,
}: BulkImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entityLabels = {
    items: 'Items',
    customers: 'Customers',
    vendors: 'Vendors',
  };

  const handleDownloadTemplate = () => {
    const url = bulkImportService.downloadTemplate(entityType);
    window.open(url, '_blank');
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: '.csv',
    fileList,
    beforeUpload: (file) => {
      // Validate file type
      if (!file.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return false;
      }

      setFileList([file as UploadFile]);
      setUploadedFile(file);
      setError(null);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
      setUploadedFile(null);
      setError(null);
    },
  };

  const handleNext = async () => {
    if (currentStep === 0 && uploadedFile) {
      // Step 1: Validate file
      setIsValidating(true);
      setError(null);
      try {
        const result = await bulkImportService.validateFile(entityType, uploadedFile);
        setValidationResult(result);
        setCurrentStep(1);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to validate file');
      } finally {
        setIsValidating(false);
      }
    } else if (currentStep === 1 && validationResult) {
      // Step 2: Move to validation results
      setCurrentStep(2);
    } else if (currentStep === 2 && uploadedFile) {
      // Step 3: Import file
      setIsImporting(true);
      setError(null);
      try {
        const hasErrors = validationResult ? validationResult.errors.length > 0 : false;
        const result = await bulkImportService.importFile(entityType, uploadedFile, hasErrors);
        setImportResult(result);
        setCurrentStep(3);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to import file');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep(0);
    setFileList([]);
    setUploadedFile(null);
    setValidationResult(null);
    setImportResult(null);
    setError(null);
    onClose();
  };

  const handleFinish = () => {
    handleClose();
    onSuccess();
  };

  const canProceed = () => {
    if (currentStep === 0) return uploadedFile !== null;
    if (currentStep === 1) return validationResult !== null;
    if (currentStep === 2) {
      return (
        validationResult &&
        (validationResult.valid || validationResult.errors.length === 0)
      );
    }
    return false;
  };

  // Preview table columns (dynamic based on validation result)
  const getPreviewColumns = (): ColumnsType<Record<string, any>> => {
    if (!validationResult || validationResult.preview.length === 0) return [];

    const firstRow = validationResult.preview[0];
    return Object.keys(firstRow).map((key) => ({
      title: key,
      dataIndex: key,
      key,
      ellipsis: true,
      width: 150,
    }));
  };

  // Error table columns
  const errorColumns: ColumnsType<ValidationError> = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: 'Field',
      dataIndex: 'field',
      key: 'field',
      width: 150,
    },
    {
      title: 'Error Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  const steps = [
    {
      title: 'Upload',
      icon: <UploadOutlined />,
    },
    {
      title: 'Preview',
      icon: <CheckCircleOutlined />,
    },
    {
      title: 'Validation',
      icon: <ExclamationCircleOutlined />,
    },
    {
      title: 'Import',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Modal
      title={`Bulk Import ${entityLabels[entityType]}`}
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      maskClosable={false}
    >
      <div className="py-4">
        <Steps current={currentStep} items={steps} className="mb-8" />

        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <div>
            <Space direction="vertical" size="large" className="w-full">
              <div>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadTemplate}
                  className="mb-4"
                >
                  Download CSV Template
                </Button>
                <Text type="secondary" className="block mb-2">
                  Download the template, fill in your data, and upload the completed CSV file.
                </Text>
              </div>

              <Dragger {...uploadProps} className="w-full">
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Click or drag CSV file to this area to upload</p>
                <p className="ant-upload-hint">
                  Only .csv files are supported. Maximum 1 file at a time.
                </p>
              </Dragger>

              {error && (
                <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
              )}
            </Space>
          </div>
        )}

        {/* Step 1: Preview */}
        {currentStep === 1 && validationResult && (
          <div>
            <Space direction="vertical" size="middle" className="w-full">
              <Alert
                message="File Preview"
                description={`Showing first ${validationResult.preview.length} rows. Total rows: ${validationResult.totalRows}`}
                type="info"
                showIcon
              />

              <Table
                dataSource={validationResult.preview}
                columns={getPreviewColumns()}
                rowKey={(record, index) => `preview-${index}`}
                pagination={false}
                scroll={{ x: 'max-content' }}
                size="small"
              />
            </Space>
          </div>
        )}

        {/* Step 2: Validation Results */}
        {currentStep === 2 && validationResult && (
          <div>
            <Space direction="vertical" size="middle" className="w-full">
              {validationResult.valid && validationResult.errors.length === 0 ? (
                <Alert
                  message="Validation Successful"
                  description={`All ${validationResult.validRows} rows are valid and ready to import.`}
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              ) : (
                <>
                  <Alert
                    message="Validation Errors Found"
                    description={`${validationResult.errors.length} error(s) found in ${validationResult.totalRows} rows. Valid rows: ${validationResult.validRows}`}
                    type="warning"
                    showIcon
                  />

                  <div>
                    <Title level={5}>Errors</Title>
                    <Table
                      dataSource={validationResult.errors}
                      columns={errorColumns}
                      rowKey={(record, index) => `error-${index}`}
                      pagination={{ pageSize: 10 }}
                      size="small"
                    />
                  </div>

                  {validationResult.validRows > 0 && (
                    <Alert
                      message="Skip Errors Option"
                      description={`You can choose to import only the ${validationResult.validRows} valid rows and skip the rows with errors.`}
                      type="info"
                      showIcon
                    />
                  )}
                </>
              )}

              {error && (
                <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
              )}
            </Space>
          </div>
        )}

        {/* Step 3: Import Progress/Result */}
        {currentStep === 3 && (
          <div>
            {isImporting ? (
              <div className="text-center py-8">
                <Progress type="circle" percent={50} status="active" />
                <Title level={4} className="mt-4">
                  Importing...
                </Title>
                <Text type="secondary">Please wait while we import your data.</Text>
              </div>
            ) : importResult ? (
              <Result
                status={importResult.success ? 'success' : 'error'}
                title={
                  importResult.success
                    ? `Successfully imported ${importResult.imported} ${entityLabels[entityType].toLowerCase()}`
                    : 'Import Failed'
                }
                subTitle={
                  importResult.success
                    ? importResult.skipped > 0
                      ? `${importResult.skipped} rows were skipped due to errors.`
                      : 'All valid rows were imported successfully.'
                    : 'Failed to import data. Please check the errors below.'
                }
                extra={
                  importResult.errors && importResult.errors.length > 0 ? (
                    <div className="text-left">
                      <Title level={5}>Errors</Title>
                      <Table
                        dataSource={importResult.errors}
                        columns={errorColumns}
                        rowKey={(record, index) => `import-error-${index}`}
                        pagination={{ pageSize: 5 }}
                        size="small"
                      />
                    </div>
                  ) : null
                }
              />
            ) : null}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button onClick={currentStep === 3 ? handleClose : handlePrevious} disabled={currentStep === 0}>
            {currentStep === 3 ? 'Close' : 'Previous'}
          </Button>

          <Space>
            <Button onClick={handleClose}>Cancel</Button>
            {currentStep < 3 ? (
              <Button
                type="primary"
                onClick={handleNext}
                loading={isValidating || isImporting}
                disabled={!canProceed()}
              >
                {currentStep === 2 ? 'Import' : 'Next'}
              </Button>
            ) : (
              <Button type="primary" onClick={handleFinish}>
                Done
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
}

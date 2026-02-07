'use client';

import { useState } from 'react';
import { Upload, Progress, App, Button } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

const { Dragger } = Upload;

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // bytes
  onUpload: (file: File) => Promise<any>;
  onRemove?: (id: string) => Promise<void>;
  multiple?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * FileUpload component with drag-drop support
 *
 * Usage:
 * <FileUpload
 *   accept="image/png,image/jpeg"
 *   maxSize={5 * 1024 * 1024}
 *   onUpload={handleUpload}
 *   onRemove={handleRemove}
 * />
 */
export function FileUpload({
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  onUpload,
  onRemove,
  multiple = false,
  disabled = false,
  children,
}: FileUploadProps) {
  const { message } = App.useApp();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const beforeUpload = (file: File) => {
    // Validate file size
    if (maxSize && file.size > maxSize) {
      message.error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`);
      return Upload.LIST_IGNORE;
    }

    // Validate file type
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          // Handle wildcard types like "image/*"
          const baseType = type.replace('/*', '');
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        message.error(`File type not accepted. Allowed: ${accept}`);
        return Upload.LIST_IGNORE;
      }
    }

    return false; // Prevent auto upload, we handle it manually
  };

  const customRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
    const uploadFile = file as File;
    const fileId = `${uploadFile.name}-${Date.now()}`;

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: current + 10 };
        });
      }, 100);

      // Call the upload handler
      const result = await onUpload(uploadFile);

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

      // Update file list with uploaded file info
      setFileList(prev =>
        prev.map(f =>
          f.uid === file.uid
            ? { ...f, status: 'done', response: result }
            : f
        )
      );

      onSuccess(result, uploadFile);
      message.success(`${uploadFile.name} uploaded successfully`);
    } catch (error: any) {
      setUploadProgress(prev => {
        const { [fileId]: _, ...rest } = prev;
        return rest;
      });

      setFileList(prev =>
        prev.map(f =>
          f.uid === file.uid
            ? { ...f, status: 'error' }
            : f
        )
      );

      onError(error);
      message.error(error?.message || `${uploadFile.name} upload failed`);
    }
  };

  const handleRemove = async (file: UploadFile) => {
    if (onRemove && file.response?.id) {
      try {
        await onRemove(file.response.id);
        message.success('File removed successfully');
        return true;
      } catch (error: any) {
        message.error(error?.message || 'Failed to remove file');
        return false;
      }
    }
    return true;
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple,
    fileList,
    accept,
    disabled,
    beforeUpload,
    customRequest,
    onRemove: handleRemove,
    onChange: handleChange,
    showUploadList: {
      showRemoveIcon: true,
      removeIcon: <DeleteOutlined />,
    },
  };

  return (
    <div className="file-upload">
      <Dragger {...uploadProps}>
        {children || (
          <div className="p-4">
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text text-base font-medium">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint text-sm text-gray-500">
              {multiple ? 'Support for single or bulk upload.' : 'Support for a single file upload.'}
              {maxSize && (
                <> Max file size: {(maxSize / 1024 / 1024).toFixed(0)}MB</>
              )}
            </p>
          </div>
        )}
      </Dragger>

      {/* Show progress for uploading files */}
      {Object.entries(uploadProgress).map(([fileId, progress]) =>
        progress < 100 ? (
          <div key={fileId} className="mt-2">
            <Progress
              percent={progress}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        ) : null
      )}
    </div>
  );
}

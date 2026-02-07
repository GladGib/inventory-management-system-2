'use client';

import { useState } from 'react';
import { Image, Card, Popconfirm, Button, Space, Tag, App, Empty, Spin } from 'antd';
import { DeleteOutlined, StarOutlined, StarFilled, EyeOutlined } from '@ant-design/icons';

interface ImageItem {
  id: string;
  filename: string;
  originalName: string;
  url?: string;
  isPrimary?: boolean;
}

interface ImagePreviewProps {
  images: ImageItem[];
  onDelete: (id: string) => Promise<void>;
  onSetPrimary?: (id: string) => Promise<void>;
  loading?: boolean;
}

/**
 * ImagePreview component - displays uploaded images in a grid with actions
 *
 * Usage:
 * <ImagePreview
 *   images={images}
 *   onDelete={handleDelete}
 *   onSetPrimary={handleSetPrimary}
 *   loading={isLoading}
 * />
 */
export function ImagePreview({
  images,
  onDelete,
  onSetPrimary,
  loading = false,
}: ImagePreviewProps) {
  const { message } = App.useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      message.success('Image deleted successfully');
    } catch (error: any) {
      message.error(error?.message || 'Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!onSetPrimary) return;

    setSettingPrimaryId(id);
    try {
      await onSetPrimary(id);
      message.success('Primary image updated');
    } catch (error: any) {
      message.error(error?.message || 'Failed to set primary image');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <Empty
        description="No images uploaded"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="image-preview-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => (
        <Card
          key={image.id}
          className="relative group"
          bodyStyle={{ padding: 0 }}
          cover={
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={image.url || `/api/v1/uploads/${image.filename}`}
                alt={image.originalName}
                className="object-cover w-full h-full"
                preview={{
                  mask: (
                    <Space direction="vertical" align="center">
                      <EyeOutlined />
                      <span className="text-xs">Preview</span>
                    </Space>
                  ),
                }}
              />
              {image.isPrimary && (
                <Tag
                  color="gold"
                  className="absolute top-2 left-2"
                  icon={<StarFilled />}
                >
                  Primary
                </Tag>
              )}
            </div>
          }
        >
          <div className="p-2">
            <p className="text-xs text-gray-600 truncate mb-2" title={image.originalName}>
              {image.originalName}
            </p>

            <Space size="small" className="w-full justify-between">
              {onSetPrimary && !image.isPrimary && (
                <Button
                  type="text"
                  size="small"
                  icon={<StarOutlined />}
                  loading={settingPrimaryId === image.id}
                  onClick={() => handleSetPrimary(image.id)}
                  title="Set as primary"
                  className="text-gray-500 hover:text-yellow-500"
                />
              )}

              <Popconfirm
                title="Delete Image"
                description="Are you sure you want to delete this image?"
                onConfirm={() => handleDelete(image.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletingId === image.id}
                  title="Delete"
                  className="ml-auto"
                />
              </Popconfirm>
            </Space>
          </div>
        </Card>
      ))}
    </div>
  );
}

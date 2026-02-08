'use client';

import { useState } from 'react';
import { Typography, App, Spin, Tabs, Card, Space, Button, Modal } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemForm } from '@/components/items/item-form';
import { VariantForm, VariantFormData } from '@/components/items/variant-form';
import { VariantList } from '@/components/items/variant-list';
import { FileUpload, ImagePreview } from '@/components/ui';
import { itemsService, CreateItemRequest } from '@/services/items-service';
import { PictureOutlined, TagsOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const itemId = params.id as string;
  const [activeTab, setActiveTab] = useState('details');
  const [showVariantForm, setShowVariantForm] = useState(false);

  // Fetch item data
  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsService.getItem(itemId),
    enabled: !!itemId,
  });

  // Fetch images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['item-images', itemId],
    queryFn: () => itemsService.getItemImages(itemId),
    enabled: !!itemId && activeTab === 'images',
  });

  // Fetch variants
  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ['item-variants', itemId],
    queryFn: () => itemsService.getItemVariants(itemId),
    enabled: !!itemId && activeTab === 'variants' && (item?.type === 'VARIANT_PARENT' || item?.type === 'SIMPLE'),
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateItemRequest>) => itemsService.updateItem(itemId, data),
    onSuccess: () => {
      message.success('Item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      router.push('/items');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update item');
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => itemsService.uploadItemImage(itemId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-images', itemId] });
    },
  });

  // Image delete mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => itemsService.deleteItemImage(itemId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-images', itemId] });
    },
  });

  // Set primary image mutation
  const setPrimaryImageMutation = useMutation({
    mutationFn: (imageId: string) => itemsService.setItemImagePrimary(itemId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-images', itemId] });
    },
  });

  // Create variants mutation
  const createVariantsMutation = useMutation({
    mutationFn: (data: VariantFormData) => itemsService.createVariants(itemId, {
      attributes: data.attributes,
      basePrice: data.basePrice,
    }),
    onSuccess: () => {
      message.success('Variants created successfully');
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['item-variants', itemId] });
      setShowVariantForm(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create variants');
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: { costPrice?: number; sellingPrice?: number } }) =>
      itemsService.updateVariant(itemId, variantId, data),
    onSuccess: () => {
      message.success('Variant updated successfully');
      queryClient.invalidateQueries({ queryKey: ['item-variants', itemId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update variant');
    },
  });

  // Toggle variant active mutation
  const toggleVariantActiveMutation = useMutation({
    mutationFn: ({ variantId, isActive }: { variantId: string; isActive: boolean }) =>
      itemsService.updateVariant(itemId, variantId, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-variants', itemId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update variant status');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!item) {
    return <div>Item not found</div>;
  }

  const tabItems = [
    {
      key: 'details',
      label: (
        <span>
          <InfoCircleOutlined /> Details
        </span>
      ),
      children: (
        <ItemForm
          initialValues={item}
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={() => router.push('/items')}
          loading={updateMutation.isPending}
          isEdit
        />
      ),
    },
    {
      key: 'images',
      label: (
        <span>
          <PictureOutlined /> Images
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card title="Upload Images" size="small">
            <FileUpload
              accept="image/png,image/jpeg,image/jpg,image/webp"
              maxSize={5 * 1024 * 1024}
              onUpload={(file) => uploadImageMutation.mutateAsync(file)}
              multiple={false}
            />
          </Card>

          <Card title="Item Images" size="small">
            <ImagePreview
              images={images.map((img) => ({
                id: img.id,
                filename: img.filename,
                originalName: img.originalName,
                isPrimary: img.isPrimary,
              }))}
              onDelete={(imageId) => deleteImageMutation.mutateAsync(imageId)}
              onSetPrimary={(imageId) => setPrimaryImageMutation.mutateAsync(imageId)}
              loading={imagesLoading}
            />
          </Card>
        </div>
      ),
    },
  ];

  // Only show Variants tab for VARIANT_PARENT or SIMPLE items
  if (item.type === 'VARIANT_PARENT' || item.type === 'SIMPLE') {
    tabItems.push({
      key: 'variants',
      label: (
        <span>
          <TagsOutlined /> Variants
        </span>
      ),
      children: (
        <div className="space-y-6">
          {item.type === 'VARIANT_PARENT' && variantsData ? (
            <>
              <Card
                title={`Variants (${variantsData.variants.length})`}
                size="small"
                extra={
                  <Space>
                    <span className="text-sm text-gray-500">
                      Total Stock: <strong>{variantsData.totalStock}</strong>
                    </span>
                  </Space>
                }
              >
                <VariantList
                  variants={variantsData.variants.map((v) => ({
                    id: v.id,
                    code: v.code,
                    name: v.name,
                    attributes: v.attributes.reduce((acc, attr) => {
                      acc[attr.attribute] = attr.value;
                      return acc;
                    }, {} as Record<string, string>),
                    costPrice: v.costPrice,
                    sellingPrice: v.sellingPrice,
                    stockOnHand: v.stockOnHand,
                    isActive: v.isActive,
                  }))}
                  onUpdate={(variantId, data) => updateVariantMutation.mutate({ variantId, data })}
                  onToggleActive={(variantId, isActive) =>
                    toggleVariantActiveMutation.mutate({ variantId, isActive })
                  }
                  loading={variantsLoading}
                />
              </Card>
            </>
          ) : (
            <Card title="Add Variants" size="small">
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  This item doesn't have variants yet. Create variants with different attributes like Size, Color, etc.
                </p>
                <Button type="primary" onClick={() => setShowVariantForm(true)}>
                  Add Variants
                </Button>
              </div>
            </Card>
          )}

          <Modal
            title="Create Variants"
            open={showVariantForm}
            onCancel={() => setShowVariantForm(false)}
            footer={null}
            width={800}
            destroyOnClose
          >
            <VariantForm
              onSubmit={(data) => createVariantsMutation.mutate(data)}
              onCancel={() => setShowVariantForm(false)}
              loading={createVariantsMutation.isPending}
            />
          </Modal>
        </div>
      ),
    });
  }

  return (
    <div>
      <Title level={4} className="mb-6">
        Edit Item: {item.name}
      </Title>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
}

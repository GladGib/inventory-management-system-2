'use client';

import { Typography, App, Spin } from 'antd';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemForm } from '@/components/items/item-form';
import { itemsService, CreateItemRequest } from '@/services/items-service';

const { Title } = Typography;

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const itemId = params.id as string;

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => itemsService.getItem(itemId),
    enabled: !!itemId,
  });

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

  return (
    <div>
      <Title level={4} className="mb-6">Edit Item: {item.name}</Title>
      <ItemForm
        initialValues={item}
        onSubmit={(values) => updateMutation.mutate(values)}
        onCancel={() => router.push('/items')}
        loading={updateMutation.isPending}
        isEdit
      />
    </div>
  );
}

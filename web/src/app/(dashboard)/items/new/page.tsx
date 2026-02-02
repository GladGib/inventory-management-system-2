'use client';

import { Typography, App } from 'antd';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ItemForm } from '@/components/items/item-form';
import { itemsService, CreateItemRequest } from '@/services/items-service';

const { Title } = Typography;

export default function NewItemPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateItemRequest) => itemsService.createItem(data),
    onSuccess: () => {
      message.success('Item created successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      router.push('/items');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create item');
    },
  });

  return (
    <div>
      <Title level={4} className="mb-6">New Item</Title>
      <ItemForm
        onSubmit={(values) => createMutation.mutate(values)}
        onCancel={() => router.push('/items')}
        loading={createMutation.isPending}
      />
    </div>
  );
}

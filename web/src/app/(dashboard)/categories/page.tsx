'use client';

import { useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, App, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsService, Category, CreateCategoryRequest } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

export default function CategoriesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => itemsService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryRequest) => itemsService.createCategory(data),
    onSuccess: () => {
      message.success('Category created successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
      itemsService.updateCategory(id, data),
    onSuccess: () => {
      message.success('Category updated successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsService.deleteCategory(id),
    onSuccess: () => {
      message.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to delete category');
    },
  });

  const handleOpenModal = (category?: Category) => {
    setEditingCategory(category || null);
    if (category) {
      form.setFieldsValue({
        name: category.name,
        description: category.description,
        parentId: category.parentId,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = (values: CreateCategoryRequest) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (category: Category) => {
    modal.confirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete "${category.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(category.id),
    });
  };

  const columns: ColumnsType<Category> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  // Filter out current category and its children from parent options
  const getParentOptions = () => {
    if (!categories) return [];
    return categories
      .filter((c) => c.id !== editingCategory?.id && c.level < 3)
      .map((c) => ({
        value: c.id,
        label: c.name,
      }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Categories</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Category
        </Button>
      </div>

      <Card>
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'New Category'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item name="parentId" label="Parent Category">
            <Select
              allowClear
              placeholder="Select parent category (optional)"
              options={getParentOptions()}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

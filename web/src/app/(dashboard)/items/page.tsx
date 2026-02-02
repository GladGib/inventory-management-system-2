'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Dropdown,
  App,
  Select,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  BarcodeOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { itemsService, Item, ItemsListParams } from '@/services/items-service';
import { PageHeader } from '@/components/ui';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

export default function ItemsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<ItemsListParams>({
    page: 1,
    limit: 20,
  });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['items', params],
    queryFn: () => itemsService.getItems(params),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => itemsService.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsService.deleteItem(id),
    onSuccess: () => {
      message.success('Item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: () => {
      message.error('Failed to delete item');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchText('');
    setParams({ page: 1, limit: 20 });
  };

  const handleDelete = (item: Item) => {
    modal.confirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(item.id),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: Item): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => router.push(`/items/${record.id}`),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => router.push(`/items/${record.id}`),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      onClick: () => handleDelete(record),
    },
  ];

  const columns: ColumnsType<Item> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
      render: (code: string) => (
        <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
          {code}
        </span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: Item) => (
        <div>
          <span className="font-medium text-gray-900">{name}</span>
          {record.description && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{record.description}</p>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150,
      render: (name: string) =>
        name ? (
          <Tag className="!bg-gray-50 !text-gray-700 !border-gray-200">{name}</Tag>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      align: 'right',
      render: (price: number) => (
        <span className="text-gray-600">{formatCurrency(price)}</span>
      ),
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 130,
      align: 'right',
      render: (price: number) => (
        <span className="font-medium text-gray-900">{formatCurrency(price)}</span>
      ),
    },
    {
      title: 'UOM',
      dataIndex: 'uom',
      key: 'uom',
      width: 80,
      render: (uom: string) => (
        <span className="text-gray-500">{uom}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag
          color={isActive ? 'success' : 'default'}
          className="!rounded-full !px-2.5"
        >
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            className="!text-gray-400 hover:!text-gray-600"
          />
        </Dropdown>
      ),
    },
  ];

  const hasFilters = searchText || params.categoryId || params.isActive !== undefined;

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle={`Manage your inventory items${data?.meta?.total ? ` (${data.meta.total} total)` : ''}`}
        breadcrumbs={[
          { title: 'Inventory', href: '/items' },
          { title: 'Items' },
        ]}
        actions={
          <>
            <Tooltip title="Scan barcode">
              <Button icon={<BarcodeOutlined />}>Scan</Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/items/new')}
            >
              Add Item
            </Button>
          </>
        }
      />

      <Card className="shadow-sm">
        {/* Filters */}
        <Row gutter={[12, 12]} className="mb-4">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Search by name or code..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={5}>
            <Select
              placeholder="All Categories"
              allowClear
              className="w-full"
              options={categories?.map((c) => ({ value: c.id, label: c.name }))}
              value={params.categoryId}
              onChange={(value) =>
                setParams((prev) => ({ ...prev, categoryId: value, page: 1 }))
              }
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Select
              placeholder="All Status"
              allowClear
              className="w-full"
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              value={params.isActive !== undefined ? String(params.isActive) : undefined}
              onChange={(value) =>
                setParams((prev) => ({
                  ...prev,
                  isActive: value ? value === 'true' : undefined,
                  page: 1,
                }))
              }
            />
          </Col>
          <Col flex="auto">
            <Space>
              <Button type="primary" onClick={handleSearch}>
                Search
              </Button>
              {hasFilters && (
                <Button onClick={handleClearFilters}>Clear</Button>
              )}
              <Tooltip title="Refresh">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        {/* Table */}
        <Table
          dataSource={data?.data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data?.meta?.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => (
              <span className="text-gray-500">
                Showing {range[0]}-{range[1]} of {total} items
              </span>
            ),
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 1000 }}
          size="middle"
          className="items-table"
          rowClassName="cursor-pointer"
          onRow={(record) => ({
            onClick: (e) => {
              // Don't navigate if clicking on action dropdown
              if ((e.target as HTMLElement).closest('.ant-dropdown-trigger')) {
                return;
              }
              router.push(`/items/${record.id}`);
            },
          })}
        />
      </Card>
    </div>
  );
}

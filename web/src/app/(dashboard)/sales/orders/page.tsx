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
  DatePicker,
  Select,
  App,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  salesService,
  SalesOrder,
  SalesOrderStatus,
  SalesOrdersListParams,
} from '@/services/sales-service';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<SalesOrderStatus, string> = {
  DRAFT: 'default',
  CONFIRMED: 'blue',
  PROCESSING: 'orange',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<SalesOrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function SalesOrdersPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<SalesOrdersListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-orders', params],
    queryFn: () => salesService.getSalesOrders(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesService.deleteSalesOrder(id),
    onSuccess: () => {
      message.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: () => {
      message.error('Failed to delete order');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => salesService.confirmOrder(id),
    onSuccess: () => {
      message.success('Order confirmed successfully');
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to confirm order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesService.cancelOrder(id),
    onSuccess: () => {
      message.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to cancel order');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleDelete = (order: SalesOrder) => {
    modal.confirm({
      title: 'Delete Order',
      content: `Are you sure you want to delete order "${order.orderNumber}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(order.id),
    });
  };

  const handleConfirm = (order: SalesOrder) => {
    modal.confirm({
      title: 'Confirm Order',
      content: `Are you sure you want to confirm order "${order.orderNumber}"? This will allocate stock.`,
      okText: 'Confirm',
      onOk: () => confirmMutation.mutate(order.id),
    });
  };

  const handleCancel = (order: SalesOrder) => {
    modal.confirm({
      title: 'Cancel Order',
      content: `Are you sure you want to cancel order "${order.orderNumber}"? This will release allocated stock.`,
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutate(order.id),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: SalesOrder): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/sales/orders/${record.id}`),
      },
    ];

    if (record.status === 'DRAFT') {
      items.push(
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => router.push(`/sales/orders/${record.id}/edit`),
        },
        {
          key: 'confirm',
          icon: <CheckCircleOutlined />,
          label: 'Confirm Order',
          onClick: () => handleConfirm(record),
        },
        { type: 'divider' },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: 'Delete',
          danger: true,
          onClick: () => handleDelete(record),
        }
      );
    } else if (['CONFIRMED', 'PROCESSING'].includes(record.status)) {
      items.push(
        { type: 'divider' },
        {
          key: 'cancel',
          icon: <CloseCircleOutlined />,
          label: 'Cancel Order',
          danger: true,
          onClick: () => handleCancel(record),
        }
      );
    }

    return items;
  };

  const columns: ColumnsType<SalesOrder> = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (orderNumber: string) => <span className="font-mono">{orderNumber}</span>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'itemCount',
      width: 80,
      align: 'center',
      render: (items: SalesOrder['items']) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      align: 'right',
      render: (total: number) => formatCurrency(total),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SalesOrderStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Sales Orders</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/sales/orders/new')}
        >
          New Order
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search orders..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Status"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, status: value, page: 1 }))}
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              className="w-full"
              onChange={(dates) => {
                setParams((prev) => ({
                  ...prev,
                  fromDate: dates?.[0]?.format('YYYY-MM-DD'),
                  toDate: dates?.[1]?.format('YYYY-MM-DD'),
                  page: 1,
                }));
              }}
            />
          </Col>
          <Col>
            <Button onClick={handleSearch}>Search</Button>
          </Col>
        </Row>

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
            showTotal: (total) => `Total ${total} orders`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

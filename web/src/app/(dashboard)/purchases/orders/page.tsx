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
  Progress,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  purchasesService,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrdersListParams,
} from '@/services/purchases-service';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  CONFIRMED: 'cyan',
  PARTIAL: 'orange',
  RECEIVED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  CONFIRMED: 'Confirmed',
  PARTIAL: 'Partial',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<PurchaseOrdersListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchasesService.getPurchaseOrders(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchasesService.deletePurchaseOrder(id),
    onSuccess: () => {
      message.success('Order deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: () => {
      message.error('Failed to delete order');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => purchasesService.sendOrder(id),
    onSuccess: () => {
      message.success('Order sent to vendor');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to send order');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => purchasesService.confirmOrder(id),
    onSuccess: () => {
      message.success('Order confirmed');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to confirm order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchasesService.cancelOrder(id),
    onSuccess: () => {
      message.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to cancel order');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleDelete = (order: PurchaseOrder) => {
    modal.confirm({
      title: 'Delete Order',
      content: `Are you sure you want to delete order "${order.orderNumber}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(order.id),
    });
  };

  const handleCancel = (order: PurchaseOrder) => {
    modal.confirm({
      title: 'Cancel Order',
      content: `Are you sure you want to cancel order "${order.orderNumber}"?`,
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

  const getReceivedPercent = (order: PurchaseOrder): number => {
    if (!order.items || order.items.length === 0) return 0;
    const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.items.reduce((sum, item) => sum + (item.receivedQuantity || 0), 0);
    return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  };

  const getActionItems = (record: PurchaseOrder): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/purchases/orders/${record.id}`),
      },
    ];

    if (record.status === 'DRAFT') {
      items.push(
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => router.push(`/purchases/orders/${record.id}/edit`),
        },
        {
          key: 'send',
          icon: <SendOutlined />,
          label: 'Send to Vendor',
          onClick: () => sendMutation.mutate(record.id),
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
    } else if (record.status === 'SENT') {
      items.push(
        {
          key: 'confirm',
          icon: <CheckCircleOutlined />,
          label: 'Confirm Order',
          onClick: () => confirmMutation.mutate(record.id),
        },
        { type: 'divider' },
        {
          key: 'cancel',
          icon: <CloseCircleOutlined />,
          label: 'Cancel',
          danger: true,
          onClick: () => handleCancel(record),
        }
      );
    } else if (['CONFIRMED', 'PARTIAL'].includes(record.status)) {
      items.push(
        {
          key: 'receive',
          icon: <InboxOutlined />,
          label: 'Receive Goods',
          onClick: () => router.push(`/purchases/orders/${record.id}?action=receive`),
        },
        { type: 'divider' },
        {
          key: 'cancel',
          icon: <CloseCircleOutlined />,
          label: 'Cancel',
          danger: true,
          onClick: () => handleCancel(record),
        }
      );
    }

    return items;
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: 'PO #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (orderNumber: string) => <span className="font-mono">{orderNumber}</span>,
    },
    {
      title: 'Vendor',
      dataIndex: ['vendor', 'name'],
      key: 'vendor',
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
      title: 'Expected',
      dataIndex: 'expectedDate',
      key: 'expectedDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
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
      title: 'Received',
      key: 'received',
      width: 120,
      render: (_, record) => {
        const percent = getReceivedPercent(record);
        return (
          <Progress
            percent={percent}
            size="small"
            status={record.status === 'RECEIVED' ? 'success' : 'active'}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: PurchaseOrderStatus) => (
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
        <Title level={4} className="mb-0">Purchase Orders</Title>
        <Space>
          <Button onClick={() => router.push('/purchases/reorder')}>
            Reorder Suggestions
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/purchases/orders/new')}
          >
            New Order
          </Button>
        </Space>
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
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Row,
  Col,
  DatePicker,
  Dropdown,
  Typography,
  App,
  Statistic,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DollarOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import { billsService, BillSummary, BillStatus, BillListParams } from '@/services/bills-service';
import { vendorsService } from '@/services/vendors-service';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const statusColors: Record<BillStatus, string> = {
  DRAFT: 'default',
  PENDING: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOID: 'gray',
};

const statusLabels: Record<BillStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
};

export default function BillsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<BillListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bills-list', params],
    queryFn: () => billsService.getBills(params),
  });

  const { data: summaryData } = useQuery({
    queryKey: ['bills-summary'],
    queryFn: () => billsService.getPaymentSummary(),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-dropdown'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => billsService.deleteBill(id),
    onSuccess: () => {
      message.success('Bill deleted');
      queryClient.invalidateQueries({ queryKey: ['bills-list'] });
      queryClient.invalidateQueries({ queryKey: ['bills-summary'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to delete bill');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleDelete = (record: BillSummary) => {
    modal.confirm({
      title: 'Delete Bill',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete bill ${record.billNumber}?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: BillSummary): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/purchases/bills/${record.id}`),
      },
    ];

    if (['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(record.status)) {
      items.push({
        key: 'payment',
        icon: <DollarOutlined />,
        label: 'Record Payment',
        onClick: () => router.push(`/purchases/bills/${record.id}?action=payment`),
      });
    }

    if (record.status === 'DRAFT') {
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleDelete(record),
      });
    }

    return items;
  };

  const columns: ColumnsType<BillSummary> = [
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
      width: 140,
      fixed: 'left',
      render: (billNumber: string, record) => (
        <Button
          type="link"
          className="p-0 font-mono"
          onClick={() => router.push(`/purchases/bills/${record.id}`)}
        >
          {billNumber}
        </Button>
      ),
    },
    {
      title: 'Vendor',
      dataIndex: 'vendorName',
      key: 'vendorName',
      width: 200,
      ellipsis: true,
      render: (name: string, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.vendorCode}</div>
        </div>
      ),
    },
    {
      title: 'Vendor Invoice',
      dataIndex: 'vendorInvoiceNumber',
      key: 'vendorInvoiceNumber',
      width: 140,
      render: (value?: string) => value || <Text type="secondary">-</Text>,
    },
    {
      title: 'Bill Date',
      dataIndex: 'billDate',
      key: 'billDate',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date: string | undefined, record) => {
        if (!date) return <Text type="secondary">-</Text>;
        const isOverdue = record.status !== 'PAID' && dayjs(date).isBefore(dayjs(), 'day');
        return (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {dayjs(date).format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <span className={value > 0 ? 'text-green-600' : ''}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balanceDue',
      key: 'balanceDue',
      width: 120,
      align: 'right',
      render: (value: number) => (
        <Text strong className={value > 0 ? 'text-red-500' : ''}>
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BillStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Bills"
        subtitle="Manage vendor bills and payments"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/purchases/bills/new')}
          >
            New Bill
          </Button>
        }
      />

      {summaryData && (
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Bills"
                value={summaryData.totalBills}
                valueStyle={{ fontSize: '1.5rem' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Total Amount"
                value={summaryData.totalAmount}
                precision={2}
                prefix="RM"
                valueStyle={{ fontSize: '1.5rem' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Paid Amount"
                value={summaryData.paidAmount}
                precision={2}
                prefix="RM"
                valueStyle={{ fontSize: '1.5rem', color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="Overdue"
                value={summaryData.overdueAmount}
                precision={2}
                prefix="RM"
                valueStyle={{ fontSize: '1.5rem', color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by bill number or vendor..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              onClear={() => {
                setSearchText('');
                setParams((prev) => ({ ...prev, search: undefined, page: 1 }));
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              allowClear
              className="w-full"
              onChange={(value) =>
                setParams((prev) => ({ ...prev, status: value, page: 1 }))
              }
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Vendor"
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-full"
              onChange={(value) =>
                setParams((prev) => ({ ...prev, vendorId: value, page: 1 }))
              }
              options={vendorsData?.data?.map((v) => ({
                value: v.id,
                label: v.name,
              }))}
            />
          </Col>
          <Col xs={24} md={7}>
            <RangePicker
              className="w-full"
              format="DD/MM/YYYY"
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
            showTotal: (total) => `Total ${total} bills`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 1300 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

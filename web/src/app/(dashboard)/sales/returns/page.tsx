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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  salesReturnsService,
  SalesReturnSummary,
  ReturnStatus,
  SalesReturnListParams,
  returnStatusLabels,
  returnStatusColors,
  returnReasonLabels,
  ReturnReason,
} from '@/services/sales-returns-service';
import { customersService } from '@/services/customers-service';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export default function SalesReturnsPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<SalesReturnListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales-returns-list', params],
    queryFn: () => salesReturnsService.getReturns(params),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-dropdown'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salesReturnsService.deleteReturn(id),
    onSuccess: () => {
      message.success('Return deleted');
      queryClient.invalidateQueries({ queryKey: ['sales-returns-list'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to delete return');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => salesReturnsService.approveReturn(id),
    onSuccess: () => {
      message.success('Return approved');
      queryClient.invalidateQueries({ queryKey: ['sales-returns-list'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to approve return');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => salesReturnsService.rejectReturn(id),
    onSuccess: () => {
      message.success('Return rejected');
      queryClient.invalidateQueries({ queryKey: ['sales-returns-list'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to reject return');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleDelete = (record: SalesReturnSummary) => {
    modal.confirm({
      title: 'Delete Return',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete return ${record.returnNumber}?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const handleApprove = (record: SalesReturnSummary) => {
    modal.confirm({
      title: 'Approve Return',
      content: `Approve return ${record.returnNumber}?`,
      okText: 'Approve',
      onOk: () => approveMutation.mutate(record.id),
    });
  };

  const handleReject = (record: SalesReturnSummary) => {
    modal.confirm({
      title: 'Reject Return',
      content: `Reject return ${record.returnNumber}?`,
      okText: 'Reject',
      okButtonProps: { danger: true },
      onOk: () => rejectMutation.mutate(record.id),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: SalesReturnSummary): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/sales/returns/${record.id}`),
      },
    ];

    if (record.status === 'PENDING_INSPECTION') {
      items.push(
        {
          key: 'approve',
          icon: <CheckCircleOutlined />,
          label: 'Approve',
          onClick: () => handleApprove(record),
        },
        {
          key: 'reject',
          icon: <CloseCircleOutlined />,
          label: 'Reject',
          danger: true,
          onClick: () => handleReject(record),
        }
      );
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

  const columns: ColumnsType<SalesReturnSummary> = [
    {
      title: 'Return #',
      dataIndex: 'returnNumber',
      key: 'returnNumber',
      width: 130,
      fixed: 'left',
      render: (returnNumber: string, record) => (
        <Button
          type="link"
          className="p-0 font-mono"
          onClick={() => router.push(`/sales/returns/${record.id}`)}
        >
          {returnNumber}
        </Button>
      ),
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 130,
      render: (invoiceNumber?: string) =>
        invoiceNumber ? (
          <span className="font-mono">{invoiceNumber}</span>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true,
      render: (name: string, record) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{record.customerCode}</div>
        </div>
      ),
    },
    {
      title: 'Return Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 110,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 140,
      render: (reason?: ReturnReason) =>
        reason ? returnReasonLabels[reason] : <Text type="secondary">-</Text>,
    },
    {
      title: 'Items',
      dataIndex: 'lineCount',
      key: 'lineCount',
      width: 70,
      align: 'center',
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
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ReturnStatus) => (
        <Tag color={returnStatusColors[status]}>{returnStatusLabels[status]}</Tag>
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
        title="Sales Returns"
        subtitle="Manage customer returns and refunds"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/sales/returns/new')}
          >
            New Return
          </Button>
        }
      />

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by return/invoice number..."
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
              options={Object.entries(returnStatusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Customer"
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-full"
              onChange={(value) =>
                setParams((prev) => ({ ...prev, customerId: value, page: 1 }))
              }
              options={customersData?.data?.map((c) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
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
            showTotal: (total) => `Total ${total} returns`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

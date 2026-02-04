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
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  invoicesService,
  Invoice,
  InvoiceStatus,
  InvoicesListParams,
} from '@/services/invoices-service';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOIDED: 'default',
};

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOIDED: 'Voided',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [params, setParams] = useState<InvoicesListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoicesService.getInvoices(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesService.deleteInvoice(id),
    onSuccess: () => {
      message.success('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: () => {
      message.error('Failed to delete invoice');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => invoicesService.sendInvoice(id),
    onSuccess: () => {
      message.success('Invoice sent successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to send invoice');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleDelete = (invoice: Invoice) => {
    modal.confirm({
      title: 'Delete Invoice',
      content: `Are you sure you want to delete invoice "${invoice.invoiceNumber}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(invoice.id),
    });
  };

  const handleSend = (invoice: Invoice) => {
    modal.confirm({
      title: 'Send Invoice',
      content: `Send invoice "${invoice.invoiceNumber}" to ${invoice.customer?.name}?`,
      okText: 'Send',
      onOk: () => sendMutation.mutate(invoice.id),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: Invoice): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/sales/invoices/${record.id}`),
      },
    ];

    if (record.status === 'DRAFT') {
      items.push(
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: 'Edit',
          onClick: () => router.push(`/sales/invoices/${record.id}/edit`),
        },
        {
          key: 'send',
          icon: <SendOutlined />,
          label: 'Send Invoice',
          onClick: () => handleSend(record),
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
    } else if (['SENT', 'PARTIAL', 'OVERDUE'].includes(record.status)) {
      items.push({
        key: 'payment',
        icon: <DollarOutlined />,
        label: 'Record Payment',
        onClick: () => router.push(`/sales/invoices/${record.id}?action=payment`),
      });
    }

    return items;
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (invoiceNumber: string) => <span className="font-mono">{invoiceNumber}</span>,
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      ellipsis: true,
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string, record: Invoice) => {
        const isOverdue = dayjs(date).isBefore(dayjs()) && !['PAID', 'CANCELLED'].includes(record.status);
        return (
          <span className={isOverdue ? 'text-red-500' : ''}>
            {dayjs(date).format('DD/MM/YYYY')}
          </span>
        );
      },
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
      title: 'Paid',
      key: 'payment',
      width: 150,
      render: (_, record: Invoice) => {
        const percent = record.totalAmount > 0
          ? Math.round((record.amountPaid / record.totalAmount) * 100)
          : 0;
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={record.status === 'PAID' ? 'success' : 'active'}
              format={() => formatCurrency(record.amountPaid)}
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: InvoiceStatus) => (
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
        <Title level={4} className="mb-0">Invoices</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/sales/invoices/new')}
        >
          New Invoice
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search invoices..."
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
            showTotal: (total) => `Total ${total} invoices`,
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

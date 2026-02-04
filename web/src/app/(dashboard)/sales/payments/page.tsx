'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Tag,
  Statistic,
  Button,
} from 'antd';
import {
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  paymentsReceivedService,
  PaymentReceived,
  PaymentsReceivedListParams,
} from '@/services/invoices-service';
import { customersService } from '@/services/customers-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const paymentMethodColors: Record<string, string> = {
  CASH: 'green',
  BANK_TRANSFER: 'blue',
  CHEQUE: 'orange',
  CREDIT_CARD: 'purple',
  OTHER: 'default',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  CREDIT_CARD: 'Credit Card',
  OTHER: 'Other',
};

export default function PaymentsReceivedPage() {
  const router = useRouter();

  const [params, setParams] = useState<PaymentsReceivedListParams>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payments-received', params],
    queryFn: () => paymentsReceivedService.getPaymentsReceived(params),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const totalAmount = data?.data?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const columns: ColumnsType<PaymentReceived> = [
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (num: string, record) => (
        <Button
          type="link"
          className="font-mono p-0"
          onClick={() => router.push(`/sales/invoices/${record.invoiceId}`)}
        >
          {num}
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: 'Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (method: string) => (
        <Tag color={paymentMethodColors[method] || 'default'}>
          {paymentMethodLabels[method] || method}
        </Tag>
      ),
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 150,
      ellipsis: true,
      render: (ref: string) => ref || <Text type="secondary">-</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount: number) => (
        <Text strong className="text-green-600">{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/sales/invoices/${record.invoiceId}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Payments Received</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Payments"
              value={data?.meta?.total || 0}
              prefix={<DollarOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Amount (This Page)"
              value={totalAmount}
              formatter={(value) => formatCurrency(value as number)}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Customer"
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, customerId: value, page: 1 }))}
              options={customersData?.data?.map((c) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
              }))}
            />
          </Col>
          <Col xs={24} md={10}>
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
            showTotal: (total) => `Total ${total} payments`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

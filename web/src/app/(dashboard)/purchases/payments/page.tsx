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
  vendorPaymentsService,
  VendorPayment,
  VendorPaymentsListParams,
} from '@/services/bills-service';
import { vendorsService } from '@/services/vendors-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';

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

export default function VendorPaymentsPage() {
  const router = useRouter();

  const [params, setParams] = useState<VendorPaymentsListParams>({
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-payments', params],
    queryFn: () => vendorPaymentsService.getVendorPayments(params),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const totalAmount = data?.data?.reduce((sum, p) => sum + p.amount, 0) || 0;

  const columns: ColumnsType<VendorPayment> = [
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Bill #',
      dataIndex: 'billNumber',
      key: 'billNumber',
      width: 140,
      render: (num: string, record) => (
        <Button
          type="link"
          className="font-mono p-0"
          onClick={() => router.push(`/purchases/bills/${record.billId}`)}
        >
          {num}
        </Button>
      ),
    },
    {
      title: 'Vendor',
      key: 'vendor',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.vendorName}</div>
          <div className="text-xs text-gray-500">{record.vendorCode}</div>
        </div>
      ),
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
        <Text strong className="text-red-600">{formatCurrency(amount)}</Text>
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
          onClick={() => router.push(`/purchases/bills/${record.billId}`)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Payments Made"
        subtitle="Track all vendor payments"
      />

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Payments"
              value={data?.meta?.total || 0}
              prefix={<DollarOutlined className="text-red-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Amount (This Page)"
              value={totalAmount}
              formatter={(value) => formatCurrency(value as number)}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Vendor"
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, vendorId: value, page: 1 }))}
              options={vendorsData?.data?.map((v) => ({
                value: v.id,
                label: `${v.code} - ${v.name}`,
              }))}
            />
          </Col>
          <Col xs={24} md={10}>
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
            showTotal: (total) => `Total ${total} payments`,
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

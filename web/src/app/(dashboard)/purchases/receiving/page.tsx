'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  MoreOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import { purchasesService, GRNSummary, GRNStatus, GRNListParams } from '@/services/purchases-service';
import { vendorsService } from '@/services/vendors-service';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const statusColors: Record<GRNStatus, string> = {
  DRAFT: 'default',
  CONFIRMED: 'green',
};

const statusLabels: Record<GRNStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
};

export default function GoodsReceivedPage() {
  const router = useRouter();
  const [params, setParams] = useState<GRNListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['grn-list', params],
    queryFn: () => purchasesService.getGRNs(params),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-dropdown'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActionItems = (record: GRNSummary): MenuProps['items'] => {
    return [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'View Details',
        onClick: () => router.push(`/purchases/receiving/${record.id}`),
      },
      {
        key: 'print',
        icon: <PrinterOutlined />,
        label: 'Print GRN',
        onClick: () => window.print(), // TODO: Implement proper print
      },
      record.purchaseOrderId && {
        key: 'view-po',
        icon: <FileTextOutlined />,
        label: 'View Purchase Order',
        onClick: () => router.push(`/purchases/orders/${record.purchaseOrderId}`),
      },
    ].filter(Boolean) as MenuProps['items'];
  };

  const columns: ColumnsType<GRNSummary> = [
    {
      title: 'GRN Number',
      dataIndex: 'grnNumber',
      key: 'grnNumber',
      width: 140,
      fixed: 'left',
      render: (grnNumber: string, record) => (
        <Button
          type="link"
          className="p-0 font-mono"
          onClick={() => router.push(`/purchases/receiving/${record.id}`)}
        >
          {grnNumber}
        </Button>
      ),
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 130,
      render: (poNumber: string, record) =>
        poNumber ? (
          <Button
            type="link"
            className="p-0 font-mono"
            onClick={() => router.push(`/purchases/orders/${record.purchaseOrderId}`)}
          >
            {poNumber}
          </Button>
        ) : (
          <Text type="secondary">Direct</Text>
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
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
    },
    {
      title: 'Receive Date',
      dataIndex: 'receiveDate',
      key: 'receiveDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Items',
      dataIndex: 'lineCount',
      key: 'lineCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: GRNStatus) => (
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
        title="Goods Received"
        subtitle="Track incoming inventory from purchase orders"
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/purchases/receiving/new')}
          >
            New GRN
          </Button>
        }
      />

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by GRN/PO number or vendor..."
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
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="Filter by status"
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
              placeholder="Filter by vendor"
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
          <Col xs={24} md={6}>
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
            showTotal: (total) => `Total ${total} records`,
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

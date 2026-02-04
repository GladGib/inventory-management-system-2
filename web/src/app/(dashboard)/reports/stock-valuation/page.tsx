'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Select,
  Row,
  Col,
  Typography,
  Statistic,
  Button,
  Space,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  InboxOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  reportsService,
  StockValuationItem,
  ReportParams,
} from '@/services/reports-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/ui';

const { Title, Text } = Typography;

export default function StockValuationReportPage() {
  const router = useRouter();
  const [params, setParams] = useState<ReportParams>({});

  const { data: report, isLoading } = useQuery({
    queryKey: ['stock-valuation', params],
    queryFn: () => reportsService.getStockValuation(params),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => itemsService.getCategories(),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const columns: ColumnsType<StockValuationItem> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120,
      fixed: 'left',
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 100,
      align: 'right',
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: 'Total Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 130,
      align: 'right',
      render: (value: number) => (
        <Text strong>{formatCurrency(value)}</Text>
      ),
    },
  ];

  const expandedRowRender = (record: StockValuationItem) => {
    const warehouseColumns: ColumnsType<any> = [
      {
        title: 'Warehouse',
        dataIndex: 'warehouseName',
        key: 'warehouseName',
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        align: 'right',
        render: (qty: number) => qty.toLocaleString(),
      },
      {
        title: 'Value',
        dataIndex: 'value',
        key: 'value',
        width: 130,
        align: 'right',
        render: (value: number) => formatCurrency(value),
      },
    ];

    return (
      <Table
        columns={warehouseColumns}
        dataSource={record.stockByWarehouse}
        rowKey="warehouseId"
        pagination={false}
        size="small"
      />
    );
  };

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/reports')}
            />
            <span>Stock Valuation Report</span>
          </Space>
        }
        extra={
          <Button icon={<DownloadOutlined />}>
            Export to Excel
          </Button>
        }
      />

      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">Warehouse:</Text>
            <Select
              placeholder="All Warehouses"
              allowClear
              className="w-full mt-1"
              onChange={(value) => setParams((prev) => ({ ...prev, warehouseId: value }))}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">Category:</Text>
            <Select
              placeholder="All Categories"
              allowClear
              className="w-full mt-1"
              onChange={(value) => setParams((prev) => ({ ...prev, categoryId: value }))}
              options={categories?.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Items"
              value={report?.summary?.totalItems || 0}
              prefix={<InboxOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Quantity"
              value={report?.summary?.totalQuantity || 0}
              formatter={(value) => (value as number).toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Value"
              value={report?.summary?.totalValue || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Stock Valuation by Item">
        <Spin spinning={isLoading}>
          <Table
            dataSource={report?.items}
            columns={columns}
            rowKey="itemId"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.stockByWarehouse.length > 0,
            }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
              pageSize: 50,
            }}
            scroll={{ x: 800 }}
            size="middle"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Text strong>{(report?.summary?.totalQuantity || 0).toLocaleString()}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>{formatCurrency(report?.summary?.totalValue || 0)}</Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            )}
          />
        </Spin>
      </Card>
    </div>
  );
}

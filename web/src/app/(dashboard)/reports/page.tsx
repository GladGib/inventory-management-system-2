'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Tabs,
  Row,
  Col,
  Typography,
  Statistic,
  Button,
  Spin,
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  DownloadOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { reportsService, ReportParams } from '@/services/reports-service';
import { warehousesService } from '@/services/warehouses-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const [params, setParams] = useState<ReportParams>({
    fromDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-summary', params],
    queryFn: () => reportsService.getSalesSummary(params),
  });

  const { data: inventorySummary, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-summary', params],
    queryFn: () => reportsService.getInventorySummary(params),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const topProductColumns: ColumnsType<any> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
          <div>{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Qty Sold',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  const topCustomerColumns: ColumnsType<any> = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  const lowStockColumns: ColumnsType<any> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
          <div>{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Days Since Last Sale',
      dataIndex: 'daysSinceLastSale',
      key: 'daysSinceLastSale',
      width: 150,
      align: 'right',
    },
  ];

  const stockByCategoryColumns: ColumnsType<any> = [
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Reports</Title>
      </div>

      <Card className="mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Text type="secondary">Date Range:</Text>
            <RangePicker
              className="w-full mt-1"
              defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
              onChange={(dates) => {
                setParams((prev) => ({
                  ...prev,
                  fromDate: dates?.[0]?.format('YYYY-MM-DD'),
                  toDate: dates?.[1]?.format('YYYY-MM-DD'),
                }));
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
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
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="sales"
        items={[
          {
            key: 'sales',
            label: 'Sales Report',
            children: (
              <Spin spinning={salesLoading}>
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Total Orders"
                        value={salesSummary?.totalOrders || 0}
                        prefix={<ShoppingCartOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Total Revenue"
                        value={salesSummary?.totalRevenue || 0}
                        precision={2}
                        prefix="RM"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Total Profit"
                        value={salesSummary?.totalProfit || 0}
                        precision={2}
                        prefix="RM"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Avg Order Value"
                        value={salesSummary?.averageOrderValue || 0}
                        precision={2}
                        prefix="RM"
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title="Top Selling Products"
                      extra={<Button icon={<DownloadOutlined />} size="small">Export</Button>}
                    >
                      <Table
                        dataSource={salesSummary?.topProducts}
                        columns={topProductColumns}
                        rowKey="itemId"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title="Top Customers"
                      extra={<Button icon={<DownloadOutlined />} size="small">Export</Button>}
                    >
                      <Table
                        dataSource={salesSummary?.topCustomers}
                        columns={topCustomerColumns}
                        rowKey="customerId"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              </Spin>
            ),
          },
          {
            key: 'inventory',
            label: 'Inventory Report',
            children: (
              <Spin spinning={inventoryLoading}>
                <Row gutter={[16, 16]} className="mb-6">
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Total Items"
                        value={inventorySummary?.totalItems || 0}
                        prefix={<InboxOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Total Value"
                        value={inventorySummary?.totalValue || 0}
                        precision={2}
                        prefix="RM"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Low Stock Items"
                        value={inventorySummary?.lowStockItems || 0}
                        valueStyle={{ color: '#faad14' }}
                        prefix={<WarningOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={12} sm={6}>
                    <Card>
                      <Statistic
                        title="Out of Stock"
                        value={inventorySummary?.outOfStockItems || 0}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <Card
                      title="Stock by Category"
                      extra={<Button icon={<DownloadOutlined />} size="small">Export</Button>}
                    >
                      <Table
                        dataSource={inventorySummary?.stockByCategory}
                        columns={stockByCategoryColumns}
                        rowKey="categoryId"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      title="Slow Moving Items"
                      extra={<Button icon={<DownloadOutlined />} size="small">Export</Button>}
                    >
                      <Table
                        dataSource={inventorySummary?.slowMovingItems}
                        columns={lowStockColumns}
                        rowKey="itemId"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </Col>
                </Row>
              </Spin>
            ),
          },
        ]}
      />
    </div>
  );
}

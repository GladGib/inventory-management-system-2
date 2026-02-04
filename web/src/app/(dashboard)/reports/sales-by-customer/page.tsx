'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  DatePicker,
  Row,
  Col,
  Typography,
  Statistic,
  Button,
  Space,
  Spin,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  reportsService,
  SalesByCustomerItem,
  ReportParams,
} from '@/services/reports-service';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/ui';
import { ExportButtons } from '@/components/reports/export-buttons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  CONFIRMED: 'blue',
  PICKING: 'cyan',
  PACKED: 'orange',
  SHIPPED: 'purple',
  INVOICED: 'gold',
  CLOSED: 'green',
  CANCELLED: 'red',
};

export default function SalesByCustomerReportPage() {
  const router = useRouter();
  const [params, setParams] = useState<ReportParams>({
    fromDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['sales-by-customer', params],
    queryFn: () => reportsService.getSalesByCustomer(params),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const columns: ColumnsType<SalesByCustomerItem> = [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
      width: 120,
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true,
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Items Sold',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 100,
      align: 'right',
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Profit',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      width: 130,
      align: 'right',
      render: (value: number) => (
        <Text type={value >= 0 ? 'success' : 'danger'}>{formatCurrency(value)}</Text>
      ),
    },
    {
      title: 'Avg Order',
      dataIndex: 'averageOrderValue',
      key: 'averageOrderValue',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  const expandedRowRender = (record: SalesByCustomerItem) => {
    const orderColumns: ColumnsType<any> = [
      {
        title: 'Order #',
        dataIndex: 'orderNumber',
        key: 'orderNumber',
        render: (num: string, row: any) => (
          <Button
            type="link"
            className="font-mono p-0"
            onClick={() => router.push(`/sales/orders/${row.orderId}`)}
          >
            {num}
          </Button>
        ),
      },
      {
        title: 'Date',
        dataIndex: 'orderDate',
        key: 'orderDate',
        render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status: string) => (
          <Tag color={statusColors[status] || 'default'}>{status}</Tag>
        ),
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        align: 'right',
        render: (value: number) => formatCurrency(value),
      },
    ];

    return (
      <div className="p-2">
        <Text strong className="mb-2 block">Recent Orders</Text>
        <Table
          columns={orderColumns}
          dataSource={record.recentOrders}
          rowKey="orderId"
          pagination={false}
          size="small"
        />
      </div>
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
            <span>Sales by Customer Report</span>
          </Space>
        }
        extra={
          <ExportButtons
            exportEndpoint="/reports/sales-by-customer/export"
            params={{
              fromDate: params.fromDate,
              toDate: params.toDate,
            }}
            filename="sales-by-customer-report"
          />
        }
      />

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
        </Row>
      </Card>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={report?.summary?.totalCustomers || 0}
              prefix={<TeamOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={report?.summary?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={report?.summary?.totalRevenue || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<DollarOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Profit"
              value={report?.summary?.totalProfit || 0}
              formatter={(value) => formatCurrency(value as number)}
              prefix={<RiseOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Sales by Customer">
        <Spin spinning={isLoading}>
          <Table
            dataSource={report?.customers}
            columns={columns}
            rowKey="customerId"
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.recentOrders.length > 0,
            }}
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} customers`,
              pageSize: 20,
            }}
            scroll={{ x: 900 }}
            size="middle"
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <Text strong>Total</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    <Text strong>{report?.summary?.totalOrders || 0}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Text strong>-</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <Text strong>{formatCurrency(report?.summary?.totalRevenue || 0)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <Text strong type="success">{formatCurrency(report?.summary?.totalProfit || 0)}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <Text strong>-</Text>
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

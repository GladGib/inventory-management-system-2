'use client';

import { Card, Row, Col, Statistic, Table, List, Tag, Typography, Skeleton, Empty, Avatar } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, LowStockItem, RecentActivity } from '@/services/dashboard-service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

// Stat Card Component with accent bar and hover state
interface StatCardProps {
  title: string;
  value: number;
  prefix?: string | React.ReactNode;
  precision?: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  valueColor: string;
  accentColor: string;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  prefix,
  precision = 0,
  icon,
  iconBgColor,
  iconColor,
  valueColor,
  accentColor,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex items-start gap-4">
          <Skeleton.Avatar active size={48} shape="square" />
          <div className="flex-1">
            <Skeleton.Input active size="small" style={{ width: 100, marginBottom: 8 }} />
            <Skeleton.Input active size="large" style={{ width: 120 }} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: iconBgColor }}
        >
          <span style={{ color: iconColor, fontSize: 20 }}>{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <Text className="text-gray-500 text-sm block mb-1">{title}</Text>
          <Statistic
            value={value}
            prefix={prefix}
            precision={precision}
            valueStyle={{
              color: valueColor,
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: dashboardService.getRecentActivity,
  });

  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery({
    queryKey: ['dashboard-low-stock'],
    queryFn: dashboardService.getLowStockItems,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    const iconConfig = {
      order: { icon: <ShoppingCartOutlined />, bg: '#e6f4ff', color: '#1677ff' },
      invoice: { icon: <FileTextOutlined />, bg: '#f6ffed', color: '#52c41a' },
      payment: { icon: <DollarOutlined />, bg: '#e6fffb', color: '#13c2c2' },
      grn: { icon: <ArrowDownOutlined />, bg: '#f9f0ff', color: '#722ed1' },
      adjustment: { icon: <ArrowUpOutlined />, bg: '#fff7e6', color: '#fa8c16' },
    };

    const config = iconConfig[type] || iconConfig.order;

    return (
      <Avatar
        size={36}
        style={{ backgroundColor: config.bg }}
        icon={<span style={{ color: config.color }}>{config.icon}</span>}
      />
    );
  };

  const lowStockColumns = [
    {
      title: 'Item Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span className="font-mono text-sm text-gray-700">{code}</span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (value: number, record: LowStockItem) => {
        const isCritical = value <= record.reorderPoint / 2;
        return (
          <Tag
            color={isCritical ? 'error' : 'warning'}
            className="font-medium"
          >
            {value} {record.uom || 'pcs'}
          </Tag>
        );
      },
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorderPoint',
      render: (value: number) => (
        <span className="text-gray-500">{value}</span>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <Title level={4} className="!mb-1 !text-gray-900">Dashboard</Title>
        <Text type="secondary" className="text-sm">
          Overview of your inventory management system
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Today's Sales"
            value={stats?.todaySales || 0}
            prefix="RM"
            precision={2}
            icon={<RiseOutlined />}
            iconBgColor="#f6ffed"
            iconColor="#52c41a"
            valueColor="#52c41a"
            accentColor="#52c41a"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            icon={<ShoppingCartOutlined />}
            iconBgColor="#e6f4ff"
            iconColor="#1677ff"
            valueColor="#1677ff"
            accentColor="#1677ff"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockItems || 0}
            icon={<WarningOutlined />}
            iconBgColor="#fffbe6"
            iconColor="#faad14"
            valueColor="#faad14"
            accentColor="#faad14"
            loading={statsLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Outstanding Receivables"
            value={stats?.outstandingReceivables || 0}
            prefix="RM"
            precision={2}
            icon={<ClockCircleOutlined />}
            iconBgColor="#fff2f0"
            iconColor="#ff4d4f"
            valueColor="#ff4d4f"
            accentColor="#ff4d4f"
            loading={statsLoading}
          />
        </Col>
      </Row>

      {/* Content Row */}
      <Row gutter={[16, 16]}>
        {/* Low Stock Alerts */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <WarningOutlined className="text-orange-500" />
                <span>Low Stock Alerts</span>
              </div>
            }
            className="h-full"
            styles={{
              body: { padding: lowStockItems?.length ? 0 : 24 },
            }}
          >
            {lowStockLoading ? (
              <div className="p-4">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            ) : lowStockItems?.length ? (
              <Table
                dataSource={lowStockItems}
                columns={lowStockColumns}
                rowKey="id"
                pagination={false}
                size="middle"
                className="border-t border-gray-100"
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="All items are well stocked"
              />
            )}
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                <span>Recent Activity</span>
              </div>
            }
            className="h-full"
          >
            {activityLoading ? (
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            ) : recentActivity?.length ? (
              <List
                dataSource={recentActivity}
                renderItem={(item) => (
                  <List.Item className="!px-0 hover:bg-gray-50 transition-colors rounded -mx-2 px-2">
                    <List.Item.Meta
                      avatar={getActivityIcon(item.type)}
                      title={
                        <span className="text-sm font-medium text-gray-900">
                          {item.description}
                        </span>
                      }
                      description={
                        <div className="flex justify-between items-center mt-1">
                          <Text type="secondary" className="text-xs">
                            {dayjs(item.createdAt).fromNow()}
                          </Text>
                          {item.amount && (
                            <Text strong className="text-emerald-600 text-sm">
                              {formatCurrency(item.amount)}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No recent activity"
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

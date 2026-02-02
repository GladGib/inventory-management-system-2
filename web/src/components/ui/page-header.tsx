'use client';

import { Typography, Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb
          className="mb-2"
          items={[
            {
              title: (
                <Link href="/dashboard" className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <HomeOutlined className="text-sm" />
                </Link>
              ),
            },
            ...breadcrumbs.map((item, index) => ({
              title: item.href ? (
                <Link href={item.href} className="text-gray-500 hover:text-blue-500 transition-colors">
                  {item.title}
                </Link>
              ) : (
                <span className="text-gray-900">{item.title}</span>
              ),
            })),
          ]}
        />
      )}

      {/* Header Row */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Title level={4} className="!mb-0 !text-gray-900 truncate">
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" className="text-sm mt-1 block">
              {subtitle}
            </Text>
          )}
        </div>
        {actions && (
          <Space className="flex-shrink-0">
            {actions}
          </Space>
        )}
      </div>
    </div>
  );
}

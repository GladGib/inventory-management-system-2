'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Spin } from 'antd';
import { Sidebar, Header } from '@/components/layout';
import { useAuthStore } from '@/stores/auth-store';

const { Sider, Content } = Layout;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setLoading } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Check auth state on mount
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [setLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        width={256}
        collapsedWidth={80}
        className="fixed left-0 top-0 bottom-0 z-10 shadow-sm"
      >
        <Sidebar collapsed={collapsed} />
      </Sider>
      <Layout className={`transition-all duration-200 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Content className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

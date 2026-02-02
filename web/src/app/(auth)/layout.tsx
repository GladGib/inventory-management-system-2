'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth-store';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-700 p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <AppstoreOutlined className="text-white text-xl" />
            </div>
            <span className="text-white font-semibold text-lg">Inventory MS</span>
          </div>
        </div>

        {/* Center Content */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage your inventory<br />with confidence
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            A complete inventory management solution designed for Malaysian auto parts,
            hardware, and spare parts wholesalers.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            {[
              { title: 'Multi-warehouse', desc: 'Track stock across locations' },
              { title: 'Barcode Support', desc: 'Scan for quick operations' },
              { title: 'Sales & Purchases', desc: 'Complete order management' },
              { title: 'Real-time Reports', desc: 'Instant business insights' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/10 backdrop-blur rounded-lg p-4"
              >
                <div className="font-medium text-white">{feature.title}</div>
                <div className="text-sm text-blue-200">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-blue-200 text-sm">
          Trusted by Malaysian SMEs
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-12 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <AppstoreOutlined className="text-white text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">Inventory</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Management</span>
            </div>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 sm:p-10">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Need help?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

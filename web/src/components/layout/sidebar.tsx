'use client';

import { Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  InboxOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'sales',
    icon: <ShoppingCartOutlined />,
    label: 'Sales',
    children: [
      { key: '/sales/orders', label: 'Sales Orders' },
      { key: '/sales/invoices', label: 'Invoices' },
      { key: '/sales/payments', label: 'Payments Received' },
      { key: '/sales/returns', label: 'Sales Returns' },
    ],
  },
  {
    key: 'purchases',
    icon: <ShopOutlined />,
    label: 'Purchases',
    children: [
      { key: '/purchases/orders', label: 'Purchase Orders' },
      { key: '/purchases/receiving', label: 'Goods Received' },
      { key: '/purchases/bills', label: 'Bills' },
    ],
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: 'Inventory',
    children: [
      { key: '/items', label: 'Items' },
      { key: '/categories', label: 'Categories' },
      { key: '/warehouses', label: 'Warehouses' },
      { key: '/inventory/stock', label: 'Stock Levels' },
      { key: '/inventory/movements', label: 'Stock Movements' },
      { key: '/inventory/adjustments', label: 'Stock Adjustments' },
      { key: '/inventory/transfers', label: 'Stock Transfers' },
      { key: '/inventory/counts', label: 'Stock Counts' },
    ],
  },
  {
    key: '/customers',
    icon: <TeamOutlined />,
    label: 'Customers',
  },
  {
    key: '/vendors',
    icon: <UserOutlined />,
    label: 'Vendors',
  },
  {
    key: 'reports',
    icon: <BarChartOutlined />,
    label: 'Reports',
    children: [
      { key: '/reports', label: 'Overview' },
      { key: '/reports/stock-valuation', label: 'Stock Valuation' },
      { key: '/reports/sales-by-customer', label: 'Sales by Customer' },
    ],
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const onClick: MenuProps['onClick'] = (e) => {
    router.push(e.key);
  };

  // Find selected key and open keys based on current path
  const getSelectedKeys = () => {
    return [pathname];
  };

  const getOpenKeys = () => {
    const openKeys: string[] = [];
    menuItems.forEach((item: any) => {
      if (item.children) {
        const hasSelected = item.children.some((child: any) => pathname.startsWith(child.key));
        if (hasSelected) {
          openKeys.push(item.key);
        }
      }
    });
    return openKeys;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-100 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <AppstoreOutlined className="text-white text-lg" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 text-sm leading-tight">
                Inventory
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                Management
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-2 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={collapsed ? [] : getOpenKeys()}
          items={menuItems}
          onClick={onClick}
          className="border-r-0"
          style={{ borderRight: 'none' }}
        />
      </div>

      {/* Footer - Version info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            v1.0.0 MVP
          </div>
        </div>
      )}
    </div>
  );
}

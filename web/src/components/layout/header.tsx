'use client';

import { Button, Dropdown, Avatar, Space, Badge, Tooltip } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/hooks';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Header({ collapsed, onToggle }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="py-2 px-1">
          <div className="font-medium text-gray-900">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-gray-500">{user?.email}</div>
        </div>
      ),
      disabled: true,
      style: { cursor: 'default' },
    },
    {
      type: 'divider',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => router.push('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: () => logoutMutation.mutate(),
    },
  ];

  // Get initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.firstName?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-10">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            className="!w-10 !h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          />
        </Tooltip>

        {/* Organization Name */}
        {user?.organizationName && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">
              {user.organizationName}
            </span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Help Button */}
        <Tooltip title="Help & Support">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            className="!w-10 !h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          />
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <Badge count={0} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<BellOutlined />}
              className="!w-10 !h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            />
          </Badge>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-100 mx-2" />

        {/* User Dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Avatar
              size={36}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium"
            >
              {getInitials()}
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900 leading-tight">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                {user?.role || 'User'}
              </span>
            </div>
            <DownOutlined className="hidden md:block text-xs text-gray-400 ml-1" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}

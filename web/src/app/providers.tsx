'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider, App as AntdApp } from 'antd';
import { useState } from 'react';

const theme = {
  token: {
    // Primary colors
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',
    colorPrimaryBg: '#e6f4ff',

    // Semantic colors
    colorSuccess: '#52c41a',
    colorSuccessBg: '#f6ffed',
    colorWarning: '#faad14',
    colorWarningBg: '#fffbe6',
    colorError: '#ff4d4f',
    colorErrorBg: '#fff2f0',
    colorInfo: '#1677ff',

    // Neutral colors
    colorText: '#262626',
    colorTextSecondary: '#595959',
    colorTextTertiary: '#8c8c8c',
    colorTextQuaternary: '#bfbfbf',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#fafafa',

    // Typography
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    lineHeight: 1.5714285714285714,

    // Spacing & Sizing
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Shadows
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    boxShadowSecondary: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    motionEaseOut: 'cubic-bezier(0, 0, 0.2, 1)',
  },
  components: {
    Card: {
      paddingLG: 24,
      borderRadiusLG: 8,
    },
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      controlHeightSM: 32,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#f5f5f5',
      borderColor: '#f0f0f0',
      headerSplitColor: '#f0f0f0',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },
    Menu: {
      itemBorderRadius: 6,
      itemMarginBlock: 4,
      itemMarginInline: 8,
      itemPaddingInline: 16,
      subMenuItemBg: 'transparent',
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={theme}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Inventory Management System for Malaysian SMEs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}

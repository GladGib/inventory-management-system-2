'use client';

import { Button, Typography } from 'antd';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Title>Inventory Management System</Title>
      <Text className="mb-8">
        Welcome to IMS - Inventory Management for Malaysian SMEs
      </Text>
      <Link href="/login">
        <Button type="primary" size="large">
          Get Started
        </Button>
      </Link>
    </main>
  );
}

'use client';

import { Form, Input, Button, Checkbox } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useLogin } from '@/hooks';
import { LoginRequest } from '@/types';

export default function LoginPage() {
  const [form] = Form.useForm();
  const loginMutation = useLogin();

  const onFinish = (values: LoginRequest) => {
    loginMutation.mutate(values);
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Form */}
      <Form
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
        size="large"
      >
        <Form.Item
          name="email"
          label={<span className="text-sm font-medium text-gray-700">Email address</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="you@example.com"
            className="rounded-lg"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-sm font-medium text-gray-700">Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter your password"
            className="rounded-lg"
          />
        </Form.Item>

        <div className="flex justify-between items-center mb-6">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox className="text-sm text-gray-600">Remember me</Checkbox>
          </Form.Item>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Form.Item className="mb-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loginMutation.isPending}
            className="h-11 rounded-lg font-medium"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form.Item>
      </Form>

      {/* Demo Credentials */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs font-medium text-blue-800 mb-2">Demo Credentials</p>
        <div className="space-y-1">
          <p className="text-xs text-blue-700">
            <span className="font-medium">Email:</span> admin@demoautoparts.com
          </p>
          <p className="text-xs text-blue-700">
            <span className="font-medium">Password:</span> admin123
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Form, Input, Button, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useResetPassword } from '@/hooks';

function ResetPasswordForm() {
  const [form] = Form.useForm();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const resetPasswordMutation = useResetPassword();

  if (!token) {
    return (
      <Result
        status="error"
        title="Invalid Link"
        subTitle="This password reset link is invalid or has expired."
        extra={
          <Link href="/forgot-password">
            <Button type="primary">Request new link</Button>
          </Link>
        }
      />
    );
  }

  const onFinish = (values: { password: string; confirmPassword: string }) => {
    resetPasswordMutation.mutate({
      token,
      password: values.password,
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset your password</h2>
      <p className="text-sm text-gray-600 mb-6">Enter your new password below.</p>

      <Form
        form={form}
        name="reset-password"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="password"
          label="New Password"
          rules={[
            { required: true, message: 'Please enter your new password' },
            { min: 8, message: 'Password must be at least 8 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Enter new password"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="Confirm new password"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={resetPasswordMutation.isPending}
          >
            Reset password
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Back to login
          </Link>
        </div>
      </Form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

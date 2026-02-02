'use client';

import { Form, Input, Button, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import { useForgotPassword } from '@/hooks';
import { ForgotPasswordRequest } from '@/types';

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const [submitted, setSubmitted] = useState(false);
  const forgotPasswordMutation = useForgotPassword();

  const onFinish = (values: ForgotPasswordRequest) => {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (submitted) {
    return (
      <Result
        status="success"
        title="Check your email"
        subTitle="We've sent a password reset link to your email address. Please check your inbox."
        extra={
          <Link href="/login">
            <Button type="primary">Back to login</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot password?</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <Form
        form={form}
        name="forgot-password"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400" />}
            placeholder="you@example.com"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={forgotPasswordMutation.isPending}
          >
            Send reset link
          </Button>
        </Form.Item>

        <div className="text-center">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeftOutlined className="mr-1" />
            Back to login
          </Link>
        </div>
      </Form>
    </>
  );
}

'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Tabs,
  Row,
  Col,
  Typography,
  App,
  Divider,
  InputNumber,
  Select,
  Switch,
  Avatar,
  Upload,
} from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth-store';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [organizationForm] = Form.useForm();

  const handleProfileUpdate = (values: any) => {
    console.log('Profile update:', values);
    message.success('Profile updated successfully');
  };

  const handlePasswordUpdate = (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match');
      return;
    }
    console.log('Password update');
    message.success('Password updated successfully');
    passwordForm.resetFields();
  };

  const handleOrganizationUpdate = (values: any) => {
    console.log('Organization update:', values);
    message.success('Organization settings updated successfully');
  };

  return (
    <div>
      <Title level={4} className="mb-6">Settings</Title>

      <Tabs
        defaultActiveKey="profile"
        tabPosition="left"
        items={[
          {
            key: 'profile',
            label: 'Profile',
            children: (
              <Card title="Profile Settings">
                <Row gutter={24}>
                  <Col xs={24} md={8} className="text-center mb-6">
                    <Avatar size={100} icon={<UserOutlined />} className="mb-4" />
                    <div>
                      <Upload showUploadList={false}>
                        <Button icon={<UploadOutlined />}>Change Photo</Button>
                      </Upload>
                    </div>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form
                      form={profileForm}
                      layout="vertical"
                      onFinish={handleProfileUpdate}
                      initialValues={{
                        firstName: user?.firstName,
                        lastName: user?.lastName,
                        email: user?.email,
                      }}
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="firstName"
                            label="First Name"
                            rules={[{ required: true }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="lastName"
                            label="Last Name"
                            rules={[{ required: true }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Form.Item name="email" label="Email">
                        <Input disabled />
                      </Form.Item>
                      <Form.Item name="phone" label="Phone">
                        <Input />
                      </Form.Item>
                      <Form.Item>
                        <Button type="primary" htmlType="submit">
                          Update Profile
                        </Button>
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: 'password',
            label: 'Password',
            children: (
              <Card title="Change Password">
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handlePasswordUpdate}
                  style={{ maxWidth: 400 }}
                >
                  <Form.Item
                    name="currentPassword"
                    label="Current Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="New Password"
                    rules={[
                      { required: true },
                      { min: 8, message: 'Password must be at least 8 characters' },
                    ]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="Confirm New Password"
                    rules={[{ required: true }]}
                  >
                    <Input.Password />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Change Password
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'organization',
            label: 'Organization',
            children: (
              <Card title="Organization Settings">
                <Form
                  form={organizationForm}
                  layout="vertical"
                  onFinish={handleOrganizationUpdate}
                  initialValues={{
                    currency: 'MYR',
                    taxRate: 0,
                    defaultPaymentTerms: 30,
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="name" label="Organization Name">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="phone" label="Phone">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="address" label="Address">
                    <Input.TextArea rows={3} />
                  </Form.Item>

                  <Divider>Financial Settings</Divider>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="currency" label="Currency">
                        <Select
                          options={[
                            { value: 'MYR', label: 'Malaysian Ringgit (MYR)' },
                            { value: 'USD', label: 'US Dollar (USD)' },
                            { value: 'SGD', label: 'Singapore Dollar (SGD)' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="taxRate" label="Default Tax Rate (%)">
                        <InputNumber className="w-full" min={0} max={100} precision={2} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="defaultPaymentTerms" label="Default Payment Terms (days)">
                        <InputNumber className="w-full" min={0} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider>Inventory Settings</Divider>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="autoGenerateCodes"
                        label="Auto-generate Item Codes"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="allowNegativeStock"
                        label="Allow Negative Stock"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      Save Settings
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'notifications',
            label: 'Notifications',
            children: (
              <Card title="Notification Preferences">
                <Form layout="vertical">
                  <Form.Item
                    name="lowStockAlerts"
                    label="Low Stock Alerts"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                  <Text type="secondary" className="block mb-4">
                    Receive notifications when items fall below reorder point
                  </Text>

                  <Form.Item
                    name="orderNotifications"
                    label="Order Notifications"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                  <Text type="secondary" className="block mb-4">
                    Receive notifications for new orders and status changes
                  </Text>

                  <Form.Item
                    name="paymentReminders"
                    label="Payment Reminders"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                  <Text type="secondary" className="block mb-4">
                    Receive reminders for overdue invoices
                  </Text>

                  <Form.Item>
                    <Button type="primary">Save Preferences</Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}

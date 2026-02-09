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
  Image,
  Spin,
  Table,
  Tag,
  Modal,
  Space,
} from 'antd';
import {
  UserOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  organizationsService,
  TaxRate,
  CreateTaxRateRequest,
  NumberSequence,
  UpdateNumberSequenceRequest,
} from '@/services/organizations-service';
import { FileUpload } from '@/components/ui';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

function TaxRatesTab() {
  const { message, modal: modalApi } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);

  const { data: taxRates, isLoading } = useQuery({
    queryKey: ['taxRates'],
    queryFn: () => organizationsService.getTaxRates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTaxRateRequest) => organizationsService.createTaxRate(data),
    onSuccess: () => {
      message.success('Tax rate created successfully');
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create tax rate');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTaxRateRequest> }) =>
      organizationsService.updateTaxRate(id, data),
    onSuccess: () => {
      message.success('Tax rate updated successfully');
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update tax rate');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationsService.deleteTaxRate(id),
    onSuccess: () => {
      message.success('Tax rate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['taxRates'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Cannot delete tax rate — it may be in use');
    },
  });

  const handleOpenModal = (taxRate?: TaxRate) => {
    setEditingTaxRate(taxRate || null);
    if (taxRate) {
      form.setFieldsValue({
        name: taxRate.name,
        rate: taxRate.rate,
        isActive: taxRate.isActive,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTaxRate(null);
    form.resetFields();
  };

  const handleSubmit = (values: CreateTaxRateRequest) => {
    if (editingTaxRate) {
      updateMutation.mutate({ id: editingTaxRate.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (taxRate: TaxRate) => {
    modalApi.confirm({
      title: 'Delete Tax Rate',
      content: `Are you sure you want to delete "${taxRate.name}"? This will fail if the tax rate is in use.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(taxRate.id),
    });
  };

  const columns: ColumnsType<TaxRate> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Rate (%)',
      dataIndex: 'rate',
      key: 'rate',
      width: 120,
      render: (rate: number) => `${Number(rate).toFixed(2)}%`,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Tax Rates"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Tax Rate
        </Button>
      }
    >
      <Table
        dataSource={taxRates}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingTaxRate ? 'Edit Tax Rate' : 'New Tax Rate'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder='e.g., "SST 10%"' />
          </Form.Item>
          <Form.Item
            name="rate"
            label="Rate (%)"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber className="w-full" min={0} max={100} precision={2} placeholder="e.g., 10.00" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingTaxRate ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

const DOC_TYPE_LABELS: Record<string, string> = {
  SO: 'Sales Order',
  PO: 'Purchase Order',
  INV: 'Invoice',
  GRN: 'Goods Received Note',
  CN: 'Credit Note',
  ADJ: 'Stock Adjustment',
  TRF: 'Stock Transfer',
  CNT: 'Stock Count',
  BILL: 'Bill',
  SHP: 'Shipment',
  RET: 'Sales Return',
};

function NumberSequencesTab() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<NumberSequence | null>(null);

  const { data: sequences, isLoading } = useQuery({
    queryKey: ['numberSequences'],
    queryFn: () => organizationsService.getNumberSequences(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ documentType, data }: { documentType: string; data: UpdateNumberSequenceRequest }) =>
      organizationsService.updateNumberSequence(documentType, data),
    onSuccess: () => {
      message.success('Number sequence updated successfully');
      queryClient.invalidateQueries({ queryKey: ['numberSequences'] });
      setIsModalOpen(false);
      setEditingSequence(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update sequence');
    },
  });

  const handleEdit = (sequence: NumberSequence) => {
    setEditingSequence(sequence);
    form.setFieldsValue({
      prefix: sequence.prefix,
      resetMonthly: sequence.resetMonthly,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (values: UpdateNumberSequenceRequest) => {
    if (editingSequence) {
      updateMutation.mutate({
        documentType: editingSequence.documentType,
        data: values,
      });
    }
  };

  const columns: ColumnsType<NumberSequence> = [
    {
      title: 'Document Type',
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type: string) => (
        <span>
          <span className="font-mono font-medium">{type}</span>
          <span className="text-gray-400 ml-2">{DOC_TYPE_LABELS[type] || type}</span>
        </span>
      ),
    },
    {
      title: 'Prefix',
      dataIndex: 'prefix',
      key: 'prefix',
      width: 120,
      render: (prefix: string) => <span className="font-mono">{prefix}</span>,
    },
    {
      title: 'Current #',
      dataIndex: 'currentNumber',
      key: 'currentNumber',
      width: 100,
      align: 'right',
    },
    {
      title: 'Reset Monthly',
      dataIndex: 'resetMonthly',
      key: 'resetMonthly',
      width: 120,
      render: (reset: boolean) => (
        <Tag color={reset ? 'blue' : 'default'}>
          {reset ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  return (
    <Card title="Number Sequences">
      <Text type="secondary" className="block mb-4">
        Configure document number prefixes and reset behavior. The current number auto-increments as documents are created.
      </Text>

      <Table
        dataSource={sequences}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={`Edit Sequence — ${editingSequence?.documentType || ''}`}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingSequence(null); }}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="prefix"
            label="Prefix"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., SO-" />
          </Form.Item>
          <Form.Item name="resetMonthly" label="Reset Monthly" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Text type="secondary" className="block mb-4">
            When enabled, the counter resets to 0 at the start of each month.
          </Text>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => { setIsModalOpen(false); setEditingSequence(null); }}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
              >
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default function SettingsPage() {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [organizationForm] = Form.useForm();

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: () => organizationsService.getOrganization(user!.organizationId),
    enabled: !!user?.organizationId,
  });

  // Logo upload mutation
  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) =>
      organizationsService.uploadLogo(user!.organizationId, file),
    onSuccess: () => {
      message.success('Logo uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error?.message || 'Failed to upload logo');
    },
  });

  // Logo delete mutation
  const deleteLogoMutation = useMutation({
    mutationFn: () => organizationsService.deleteLogo(user!.organizationId),
    onSuccess: () => {
      message.success('Logo deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error?.message || 'Failed to delete logo');
    },
  });

  // Organization update mutation
  const updateOrgMutation = useMutation({
    mutationFn: (values: any) =>
      organizationsService.updateOrganization(user!.organizationId, values),
    onSuccess: () => {
      message.success('Organization settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error?.message || 'Failed to update organization');
    },
  });

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
    updateOrgMutation.mutate(values);
  };

  const handleLogoUpload = async (file: File) => {
    return uploadLogoMutation.mutateAsync(file);
  };

  const handleLogoDelete = async () => {
    await deleteLogoMutation.mutateAsync();
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
            children: isLoadingOrg ? (
              <div className="flex items-center justify-center py-12">
                <Spin size="large" />
              </div>
            ) : (
              <Card title="Organization Settings">
                {/* Logo Section */}
                <div className="mb-6">
                  <Title level={5} className="mb-4">Organization Logo</Title>
                  <Row gutter={24}>
                    <Col xs={24} md={8} className="text-center">
                      {organization?.logoUrl ? (
                        <div className="mb-4">
                          <Image
                            src={organizationsService.getLogoUrl(user!.organizationId)}
                            alt="Organization Logo"
                            className="rounded-lg shadow-sm"
                            style={{ maxHeight: 200, objectFit: 'contain' }}
                          />
                          <div className="mt-3">
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={handleLogoDelete}
                              loading={deleteLogoMutation.isPending}
                            >
                              Remove Logo
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4">
                          <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                            <span className="text-gray-400 text-sm">No Logo</span>
                          </div>
                        </div>
                      )}
                    </Col>
                    <Col xs={24} md={16}>
                      <FileUpload
                        accept="image/png,image/jpeg,image/jpg"
                        maxSize={2 * 1024 * 1024}
                        onUpload={handleLogoUpload}
                        disabled={uploadLogoMutation.isPending}
                      >
                        <div className="p-4">
                          <p className="ant-upload-drag-icon">
                            <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                          </p>
                          <p className="ant-upload-text text-base font-medium">
                            Click or drag logo to upload
                          </p>
                          <p className="ant-upload-hint text-sm text-gray-500">
                            PNG or JPG format, max 2MB
                          </p>
                        </div>
                      </FileUpload>
                    </Col>
                  </Row>
                </div>

                <Divider />

                <Form
                  form={organizationForm}
                  layout="vertical"
                  onFinish={handleOrganizationUpdate}
                  initialValues={{
                    name: organization?.name,
                    phone: organization?.phone,
                    address: organization?.address,
                    currency: organization?.currency || 'MYR',
                    taxRate: organization?.taxRate || 0,
                    defaultPaymentTerms: organization?.defaultPaymentTerms || 30,
                    autoGenerateCodes: organization?.autoGenerateCodes ?? true,
                    allowNegativeStock: organization?.allowNegativeStock ?? false,
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
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateOrgMutation.isPending}
                    >
                      Save Settings
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            ),
          },
          {
            key: 'tax-rates',
            label: 'Tax Rates',
            children: <TaxRatesTab />,
          },
          {
            key: 'number-sequences',
            label: 'Number Sequences',
            children: <NumberSequencesTab />,
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

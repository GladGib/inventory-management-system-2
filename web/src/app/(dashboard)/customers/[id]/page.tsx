'use client';

import { useState } from 'react';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Tag,
  Space,
  App,
  Row,
  Col,
  Typography,
  Skeleton,
  Modal,
  Form,
  Input,
  Switch,
  Select,
  Tabs,
  Empty,
  DatePicker,
  Divider,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RollbackOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  customersService,
  Customer,
  CustomerAddress,
  CreateAddressRequest,
  UpdateAddressRequest,
  CustomerTransaction,
  CustomerTransactionsParams,
  CustomerStatement,
  StatementParams,
} from '@/services/customers-service';
import { apiClient } from '@/lib/api-client';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const transactionTypeColors: Record<string, string> = {
  ORDER: 'blue',
  INVOICE: 'purple',
  PAYMENT: 'green',
  RETURN: 'orange',
};

const transactionTypeIcons: Record<string, React.ReactNode> = {
  ORDER: <ShoppingCartOutlined />,
  INVOICE: <FileTextOutlined />,
  PAYMENT: <DollarOutlined />,
  RETURN: <RollbackOutlined />,
};

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [addressForm] = Form.useForm();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [transactionParams, setTransactionParams] = useState<CustomerTransactionsParams>({
    page: 1,
    limit: 10,
  });
  const [statementParams, setStatementParams] = useState<StatementParams>({
    fromDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
  });
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch customer details
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.getCustomer(id),
  });

  // Fetch customer addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['customer-addresses', id],
    queryFn: () => customersService.getAddresses(id),
  });

  // Fetch credit info
  const { data: creditInfo } = useQuery({
    queryKey: ['customer-credit', id],
    queryFn: () => customersService.getCreditInfo(id),
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['customer-transactions', id, transactionParams],
    queryFn: () => customersService.getTransactionHistory(id, transactionParams),
  });

  // Fetch statement
  const { data: statement, isLoading: statementLoading, refetch: refetchStatement } = useQuery({
    queryKey: ['customer-statement', id, statementParams],
    queryFn: () => customersService.getStatement(id, statementParams),
    enabled: !!statementParams.fromDate && !!statementParams.toDate,
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: (data: CreateAddressRequest) => customersService.addAddress(id, data),
    onSuccess: () => {
      message.success('Address added successfully');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', id] });
      handleCloseAddressModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to add address');
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: UpdateAddressRequest }) =>
      customersService.updateAddress(id, addressId, data),
    onSuccess: () => {
      message.success('Address updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', id] });
      handleCloseAddressModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update address');
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (addressId: string) => customersService.deleteAddress(id, addressId),
    onSuccess: () => {
      message.success('Address deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to delete address');
    },
  });

  // Set default address mutation
  const setDefaultAddressMutation = useMutation({
    mutationFn: (addressId: string) => customersService.setDefaultAddress(id, addressId),
    onSuccess: () => {
      message.success('Default address updated');
      queryClient.invalidateQueries({ queryKey: ['customer-addresses', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to set default address');
    },
  });

  const handleOpenAddressModal = (address?: CustomerAddress) => {
    setEditingAddress(address || null);
    if (address) {
      addressForm.setFieldsValue(address);
    } else {
      addressForm.resetFields();
      addressForm.setFieldsValue({ country: 'Malaysia' });
    }
    setIsAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    addressForm.resetFields();
  };

  const handleSubmitAddress = (values: any) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ addressId: editingAddress.id, data: values });
    } else {
      addAddressMutation.mutate(values);
    }
  };

  const handleDeleteAddress = (address: CustomerAddress) => {
    modal.confirm({
      title: 'Delete Address',
      content: `Are you sure you want to delete "${address.label}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteAddressMutation.mutate(address.id),
    });
  };

  const handleDownloadStatementPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await apiClient.get(
        `/customers/${id}/statement/pdf`,
        {
          params: statementParams,
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement-${customer?.code}-${statementParams.fromDate}-to-${statementParams.toDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Statement downloaded successfully');
    } catch (error: any) {
      message.error('Failed to download statement');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const transactionColumns: ColumnsType<CustomerTransaction> = [
    {
      title: 'Date',
      dataIndex: 'documentDate',
      key: 'documentDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag icon={transactionTypeIcons[type]} color={transactionTypeColors[type]}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Document #',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 150,
      render: (docNo: string) => <span className="font-mono">{docNo}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag>{status}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  const statementColumns: ColumnsType<any> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Document',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 130,
      render: (docNo: string) => <span className="font-mono">{docNo}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'documentType',
      key: 'documentType',
      width: 100,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Debit',
      dataIndex: 'debit',
      key: 'debit',
      width: 110,
      align: 'right',
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
    },
    {
      title: 'Credit',
      dataIndex: 'credit',
      key: 'credit',
      width: 110,
      align: 'right',
      render: (value: number) => (value > 0 ? formatCurrency(value) : '-'),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 110,
      align: 'right',
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : ''}>
          {formatCurrency(value)}
        </span>
      ),
    },
  ];

  if (customerLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!customer) {
    return <div>Customer not found</div>;
  }

  const tabItems = [
    {
      key: 'addresses',
      label: 'Addresses',
      children: (
        <Card
          title="Customer Addresses"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenAddressModal()}>
              Add Address
            </Button>
          }
        >
          {addresses && addresses.length > 0 ? (
            <List
              dataSource={addresses}
              loading={addressesLoading}
              renderItem={(address) => (
                <List.Item
                  actions={[
                    !address.isDefault && (
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setDefaultAddressMutation.mutate(address.id)}
                        loading={setDefaultAddressMutation.isPending}
                      >
                        Set Default
                      </Button>
                    ),
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenAddressModal(address)}
                    />,
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteAddress(address)}
                    />,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={<EnvironmentOutlined className="text-xl text-blue-500 mt-1" />}
                    title={
                      <Space>
                        {address.label}
                        {address.isDefault && (
                          <Tag color="blue" icon={<CheckCircleOutlined />}>
                            Default
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-gray-500">
                        <div>{address.addressLine1}</div>
                        {address.addressLine2 && <div>{address.addressLine2}</div>}
                        <div>
                          {address.city}, {address.state} {address.postalCode}
                        </div>
                        <div>{address.country}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No addresses added" />
          )}
        </Card>
      ),
    },
    {
      key: 'transactions',
      label: 'Transaction History',
      children: (
        <Card
          title="Transactions"
          extra={
            <Space>
              <Select
                placeholder="Filter by type"
                allowClear
                style={{ width: 150 }}
                onChange={(value) =>
                  setTransactionParams((prev) => ({ ...prev, type: value, page: 1 }))
                }
                options={[
                  { value: 'ORDER', label: 'Sales Orders' },
                  { value: 'INVOICE', label: 'Invoices' },
                  { value: 'PAYMENT', label: 'Payments' },
                  { value: 'RETURN', label: 'Returns' },
                ]}
              />
              <RangePicker
                onChange={(dates) => {
                  setTransactionParams((prev) => ({
                    ...prev,
                    fromDate: dates?.[0]?.format('YYYY-MM-DD'),
                    toDate: dates?.[1]?.format('YYYY-MM-DD'),
                    page: 1,
                  }));
                }}
              />
            </Space>
          }
        >
          <Table
            dataSource={transactions?.data || []}
            columns={transactionColumns}
            rowKey="id"
            loading={transactionsLoading}
            pagination={{
              current: transactionParams.page,
              pageSize: transactionParams.limit,
              total: transactions?.meta?.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setTransactionParams((prev) => ({ ...prev, page, limit: pageSize }));
              },
            }}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'statement',
      label: 'Statement',
      children: (
        <Card
          title="Account Statement"
          extra={
            <Space>
              <RangePicker
                value={[dayjs(statementParams.fromDate), dayjs(statementParams.toDate)]}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setStatementParams({
                      fromDate: dates[0].format('YYYY-MM-DD'),
                      toDate: dates[1].format('YYYY-MM-DD'),
                    });
                  }
                }}
              />
              <Button icon={<PrinterOutlined />} onClick={handlePrintStatement}>
                Print
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadStatementPdf}
                loading={downloadingPdf}
              >
                Download PDF
              </Button>
            </Space>
          }
        >
          {statement ? (
            <div className="print-area">
              {/* Statement Header */}
              <div className="mb-6 p-4 bg-gray-50 rounded print:bg-white">
                <Row gutter={24}>
                  <Col span={12}>
                    <Text strong>Customer:</Text>
                    <div>{statement.customerName}</div>
                    <div className="font-mono text-gray-500">{statement.customerCode}</div>
                    {statement.customerAddress && <div className="text-gray-500">{statement.customerAddress}</div>}
                    {statement.customerPhone && <div className="text-gray-500">{statement.customerPhone}</div>}
                    {statement.customerEmail && <div className="text-gray-500">{statement.customerEmail}</div>}
                  </Col>
                  <Col span={12} className="text-right">
                    <Text strong>Statement Period:</Text>
                    <div>
                      {dayjs(statement.fromDate).format('DD/MM/YYYY')} -{' '}
                      {dayjs(statement.toDate).format('DD/MM/YYYY')}
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Summary */}
              <Row gutter={24} className="mb-6">
                <Col span={6}>
                  <Card size="small">
                    <Text type="secondary">Opening Balance</Text>
                    <Title level={4} className="mb-0">
                      {formatCurrency(statement.openingBalance)}
                    </Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Text type="secondary">Total Debits</Text>
                    <Title level={4} className="mb-0 text-red-500">
                      {formatCurrency(statement.totalDebits)}
                    </Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Text type="secondary">Total Credits</Text>
                    <Title level={4} className="mb-0 text-green-500">
                      {formatCurrency(statement.totalCredits)}
                    </Title>
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Text type="secondary">Closing Balance</Text>
                    <Title
                      level={4}
                      className={`mb-0 ${statement.closingBalance > 0 ? 'text-red-500' : 'text-green-500'}`}
                    >
                      {formatCurrency(statement.closingBalance)}
                    </Title>
                  </Card>
                </Col>
              </Row>

              {/* Statement Lines */}
              <Table
                dataSource={statement.lines}
                columns={statementColumns}
                rowKey={(record, index) => `${record.documentNumber}-${index}`}
                loading={statementLoading}
                pagination={false}
                size="small"
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row className="bg-gray-50 font-bold">
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text strong>Totals:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text strong className="text-red-500">
                          {formatCurrency(statement.totalDebits)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right">
                        <Text strong className="text-green-500">
                          {formatCurrency(statement.totalCredits)}
                        </Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">
                        <Text
                          strong
                          className={statement.closingBalance > 0 ? 'text-red-500' : 'text-green-500'}
                        >
                          {formatCurrency(statement.closingBalance)}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          ) : (
            <Empty description="Select a date range to view statement" />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <Title level={4} className="mb-0">
              {customer.name}
            </Title>
            <Text type="secondary" className="font-mono">
              {customer.code}
            </Text>
          </div>
        </div>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/customers?edit=${customer.id}`)}>
            Edit Customer
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card title="Customer Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={customer.isActive ? 'green' : 'default'}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">{customer.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Email">{customer.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tax ID">{customer.taxId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                {customer.paymentTerms} days
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Credit Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Credit Limit">
                {formatCurrency(creditInfo?.creditLimit || customer.creditLimit)}
              </Descriptions.Item>
              <Descriptions.Item label="Current Balance">
                <span
                  className={
                    (creditInfo?.currentBalance || customer.balance) > 0
                      ? 'text-red-500'
                      : ''
                  }
                >
                  {formatCurrency(creditInfo?.currentBalance || customer.balance)}
                </span>
              </Descriptions.Item>
              {creditInfo && (
                <>
                  <Descriptions.Item label="Total Outstanding">
                    <span className={creditInfo.totalOutstanding > 0 ? 'text-red-500' : ''}>
                      {formatCurrency(creditInfo.totalOutstanding)}
                    </span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Available Credit">
                    <span className={creditInfo.availableCredit > 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(creditInfo.availableCredit)}
                    </span>
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          {customer.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{customer.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Tabs items={tabItems} />
        </Col>
      </Row>

      {/* Add/Edit Address Modal */}
      <Modal
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        open={isAddressModalOpen}
        onCancel={handleCloseAddressModal}
        footer={null}
        width={500}
      >
        <Form
          form={addressForm}
          layout="vertical"
          onFinish={handleSubmitAddress}
          initialValues={{ country: 'Malaysia' }}
        >
          <Form.Item
            name="label"
            label="Address Label"
            rules={[{ required: true, message: 'Please enter a label' }]}
          >
            <Input placeholder="e.g., Main Office, Warehouse" />
          </Form.Item>

          <Form.Item
            name="addressLine1"
            label="Address Line 1"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input placeholder="Street address" />
          </Form.Item>

          <Form.Item name="addressLine2" label="Address Line 2">
            <Input placeholder="Apt, suite, unit, etc. (optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="City" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please select state' }]}
              >
                <Select
                  placeholder="Select state"
                  options={[
                    { value: 'Johor', label: 'Johor' },
                    { value: 'Kedah', label: 'Kedah' },
                    { value: 'Kelantan', label: 'Kelantan' },
                    { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
                    { value: 'Labuan', label: 'Labuan' },
                    { value: 'Melaka', label: 'Melaka' },
                    { value: 'Negeri Sembilan', label: 'Negeri Sembilan' },
                    { value: 'Pahang', label: 'Pahang' },
                    { value: 'Penang', label: 'Penang' },
                    { value: 'Perak', label: 'Perak' },
                    { value: 'Perlis', label: 'Perlis' },
                    { value: 'Putrajaya', label: 'Putrajaya' },
                    { value: 'Sabah', label: 'Sabah' },
                    { value: 'Sarawak', label: 'Sarawak' },
                    { value: 'Selangor', label: 'Selangor' },
                    { value: 'Terengganu', label: 'Terengganu' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input placeholder="Postal code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="country" label="Country">
                <Input placeholder="Country" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isDefault" label="Set as Default Address" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseAddressModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addAddressMutation.isPending || updateAddressMutation.isPending}
              >
                {editingAddress ? 'Update' : 'Add Address'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

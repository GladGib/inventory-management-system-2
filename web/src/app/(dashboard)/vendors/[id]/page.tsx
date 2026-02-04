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
  InputNumber,
  Switch,
  Select,
  Tabs,
  Empty,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  vendorsService,
  Vendor,
  VendorItem,
  CreateVendorItemRequest,
  UpdateVendorItemRequest,
  VendorTransaction,
  VendorTransactionsParams,
} from '@/services/vendors-service';
import { itemsService, Item } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const transactionTypeColors: Record<string, string> = {
  PO: 'blue',
  GRN: 'cyan',
  BILL: 'purple',
  PAYMENT: 'green',
};

const transactionTypeIcons: Record<string, React.ReactNode> = {
  PO: <ShoppingCartOutlined />,
  GRN: <InboxOutlined />,
  BILL: <FileTextOutlined />,
  PAYMENT: <DollarOutlined />,
};

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [itemForm] = Form.useForm();

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorItem | null>(null);
  const [transactionParams, setTransactionParams] = useState<VendorTransactionsParams>({
    page: 1,
    limit: 10,
  });

  // Fetch vendor details
  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsService.getVendor(id),
  });

  // Fetch vendor items
  const { data: vendorItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['vendor-items', id],
    queryFn: () => vendorsService.getVendorItems(id),
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['vendor-transactions', id, transactionParams],
    queryFn: () => vendorsService.getTransactionHistory(id, transactionParams),
  });

  // Fetch items for dropdown
  const { data: allItems } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsService.getItems({ limit: 500, isActive: true }),
  });

  // Add vendor item mutation
  const addItemMutation = useMutation({
    mutationFn: (data: CreateVendorItemRequest) => vendorsService.addVendorItem(id, data),
    onSuccess: () => {
      message.success('Item linked successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-items', id] });
      handleCloseItemModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to link item');
    },
  });

  // Update vendor item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateVendorItemRequest }) =>
      vendorsService.updateVendorItem(id, itemId, data),
    onSuccess: () => {
      message.success('Item updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-items', id] });
      handleCloseItemModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update item');
    },
  });

  // Remove vendor item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: string) => vendorsService.removeVendorItem(id, itemId),
    onSuccess: () => {
      message.success('Item unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor-items', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to unlink item');
    },
  });

  const handleOpenItemModal = (item?: VendorItem) => {
    setEditingItem(item || null);
    if (item) {
      itemForm.setFieldsValue({
        itemId: item.itemId,
        vendorSku: item.vendorSku,
        unitCost: item.unitCost,
        leadTimeDays: item.leadTimeDays,
        minOrderQty: item.minOrderQty,
        isPreferred: item.isPreferred,
        notes: item.notes,
      });
    } else {
      itemForm.resetFields();
    }
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
    itemForm.resetFields();
  };

  const handleSubmitItem = (values: any) => {
    if (editingItem) {
      const { itemId, ...updateData } = values;
      updateItemMutation.mutate({ itemId: editingItem.itemId, data: updateData });
    } else {
      addItemMutation.mutate(values);
    }
  };

  const handleRemoveItem = (item: VendorItem) => {
    modal.confirm({
      title: 'Remove Item',
      content: `Are you sure you want to unlink "${item.itemName}" from this vendor?`,
      okText: 'Remove',
      okButtonProps: { danger: true },
      onOk: () => removeItemMutation.mutate(item.itemId),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  // Filter out items already linked to vendor
  const availableItems = allItems?.data?.filter(
    (item) => !vendorItems?.some((vi) => vi.itemId === item.id)
  ) || [];

  const vendorItemColumns: ColumnsType<VendorItem> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 120,
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
    },
    {
      title: 'Vendor SKU',
      dataIndex: 'vendorSku',
      key: 'vendorSku',
      width: 120,
      render: (sku: string) => sku || '-',
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 120,
      align: 'right',
      render: (value: number) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTimeDays',
      key: 'leadTimeDays',
      width: 100,
      align: 'center',
      render: (days: number) => (days ? `${days} days` : '-'),
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderQty',
      key: 'minOrderQty',
      width: 100,
      align: 'center',
      render: (qty: number) => qty || '-',
    },
    {
      title: 'Preferred',
      dataIndex: 'isPreferred',
      key: 'isPreferred',
      width: 80,
      align: 'center',
      render: (isPreferred: boolean) =>
        isPreferred ? <StarFilled className="text-yellow-500" /> : <StarOutlined className="text-gray-300" />,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenItemModal(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveItem(record)}
          />
        </Space>
      ),
    },
  ];

  const transactionColumns: ColumnsType<VendorTransaction> = [
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

  if (vendorLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!vendor) {
    return <div>Vendor not found</div>;
  }

  const tabItems = [
    {
      key: 'items',
      label: 'Linked Items',
      children: (
        <Card
          title="Items Supplied"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenItemModal()}>
              Link Item
            </Button>
          }
        >
          {vendorItems && vendorItems.length > 0 ? (
            <Table
              dataSource={vendorItems}
              columns={vendorItemColumns}
              rowKey="id"
              loading={itemsLoading}
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No items linked to this vendor" />
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
                onChange={(value) => setTransactionParams((prev) => ({ ...prev, type: value, page: 1 }))}
                options={[
                  { value: 'PO', label: 'Purchase Orders' },
                  { value: 'GRN', label: 'GRNs' },
                  { value: 'BILL', label: 'Bills' },
                  { value: 'PAYMENT', label: 'Payments' },
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
              {vendor.name}
            </Title>
            <Text type="secondary" className="font-mono">
              {vendor.code}
            </Text>
          </div>
        </div>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => router.push(`/vendors?edit=${vendor.id}`)}>
            Edit Vendor
          </Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card title="Vendor Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={vendor.isActive ? 'green' : 'default'}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">{vendor.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Email">{vendor.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tax ID">{vendor.taxId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                {vendor.paymentTerms} days
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Account Balance" className="mb-6">
            <div className="text-center py-4">
              <Text type="secondary">Outstanding Balance</Text>
              <Title
                level={2}
                className={`mb-0 ${vendor.balance > 0 ? 'text-red-500' : 'text-green-500'}`}
              >
                {formatCurrency(vendor.balance)}
              </Title>
              {vendor.balance > 0 && (
                <Text type="secondary">Amount owed to vendor</Text>
              )}
            </div>
          </Card>

          {vendor.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{vendor.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={16}>
          <Tabs items={tabItems} />
        </Col>
      </Row>

      {/* Add/Edit Item Modal */}
      <Modal
        title={editingItem ? 'Edit Linked Item' : 'Link Item to Vendor'}
        open={isItemModalOpen}
        onCancel={handleCloseItemModal}
        footer={null}
        width={500}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleSubmitItem}>
          {!editingItem && (
            <Form.Item
              name="itemId"
              label="Select Item"
              rules={[{ required: true, message: 'Please select an item' }]}
            >
              <Select
                showSearch
                placeholder="Search for an item"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={availableItems.map((item) => ({
                  value: item.id,
                  label: `${item.code} - ${item.name}`,
                }))}
              />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vendorSku" label="Vendor SKU">
                <Input placeholder="Vendor's item code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitCost" label="Unit Cost (RM)">
                <InputNumber className="w-full" min={0} precision={2} placeholder="0.00" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="leadTimeDays" label="Lead Time (days)">
                <InputNumber className="w-full" min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minOrderQty" label="Min Order Qty">
                <InputNumber className="w-full" min={1} placeholder="1" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="isPreferred" label="Preferred Supplier" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseItemModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={addItemMutation.isPending || updateItemMutation.isPending}
              >
                {editingItem ? 'Update' : 'Link Item'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

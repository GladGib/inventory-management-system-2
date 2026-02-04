'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Tag,
  App,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Tabs,
  Statistic,
  Alert,
  Divider,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  StockAdjustment,
  AdjustmentType,
  CreateStockAdjustmentRequest,
} from '@/services/inventory-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService, Item } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const adjustmentTypeColors: Record<AdjustmentType, string> = {
  ADD: 'green',
  SUBTRACT: 'red',
  DAMAGE: 'orange',
  THEFT: 'red',
  CORRECTION: 'blue',
  OTHER: 'purple',
};

const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  ADD: 'Add Stock',
  SUBTRACT: 'Remove Stock',
  DAMAGE: 'Damaged',
  THEFT: 'Theft/Loss',
  CORRECTION: 'Correction',
  OTHER: 'Other',
};

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CONFIRMED: 'success',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONFIRMED: 'Confirmed',
};

interface AdjustmentItem {
  key: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
}

export default function StockAdjustmentsPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const [params, setParams] = useState<{
    page: number;
    limit: number;
    warehouseId?: string;
    type?: AdjustmentType;
    status?: string;
  }>({
    page: 1,
    limit: 20,
  });
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingAdjustment, setViewingAdjustment] = useState<StockAdjustment | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [adjustmentItems, setAdjustmentItems] = useState<AdjustmentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-adjustments', params],
    queryFn: () => inventoryService.getStockAdjustments(params),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const { data: items } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => itemsService.getItems({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStockAdjustmentRequest) => inventoryService.createStockAdjustment(data),
    onSuccess: () => {
      message.success('Stock adjustment created successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create adjustment');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => inventoryService.approveStockAdjustment(id),
    onSuccess: () => {
      message.success('Adjustment approved successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setViewingAdjustment(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to approve adjustment');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      inventoryService.rejectStockAdjustment(id, reason),
    onSuccess: () => {
      message.success('Adjustment rejected');
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setRejectModalOpen(false);
      setRejectingId(null);
      setViewingAdjustment(null);
      rejectForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to reject adjustment');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => inventoryService.confirmStockAdjustment(id),
    onSuccess: () => {
      message.success('Adjustment confirmed and applied to inventory');
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setViewingAdjustment(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to confirm adjustment');
    },
  });

  const handleOpenModal = () => {
    form.resetFields();
    setAdjustmentItems([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setAdjustmentItems([]);
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      message.warning('Please select an item');
      return;
    }

    const existingItem = adjustmentItems.find((i) => i.itemId === selectedItem.id);
    if (existingItem) {
      message.warning('Item already added');
      return;
    }

    setAdjustmentItems([
      ...adjustmentItems,
      {
        key: Date.now().toString(),
        itemId: selectedItem.id,
        itemCode: selectedItem.code,
        itemName: selectedItem.name,
        quantity: 1,
      },
    ]);
    setSelectedItem(null);
  };

  const handleUpdateItemQuantity = (key: string, quantity: number) => {
    setAdjustmentItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (key: string) => {
    setAdjustmentItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSubmit = (values: any) => {
    if (adjustmentItems.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const adjustmentData: CreateStockAdjustmentRequest = {
      warehouseId: values.warehouseId,
      adjustmentType: values.adjustmentType,
      reason: values.reason,
      lines: adjustmentItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    };

    createMutation.mutate(adjustmentData);
  };

  const handleApprove = (id: string) => {
    modal.confirm({
      title: 'Approve Adjustment',
      icon: <CheckCircleOutlined className="text-green-500" />,
      content: 'Are you sure you want to approve this stock adjustment?',
      okText: 'Approve',
      okType: 'primary',
      onOk: () => approveMutation.mutate(id),
    });
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingId(id);
    setRejectModalOpen(true);
  };

  const handleReject = (values: { reason?: string }) => {
    if (rejectingId) {
      rejectMutation.mutate({ id: rejectingId, reason: values.reason });
    }
  };

  const handleConfirm = (id: string) => {
    modal.confirm({
      title: 'Confirm Adjustment',
      icon: <ExclamationCircleOutlined className="text-blue-500" />,
      content: (
        <div>
          <p>Are you sure you want to confirm this stock adjustment?</p>
          <Alert
            type="warning"
            message="This action will update inventory levels"
            className="mt-2"
            showIcon
          />
        </div>
      ),
      okText: 'Confirm & Apply',
      okType: 'primary',
      onOk: () => confirmMutation.mutate(id),
    });
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'all') {
      setParams((prev) => ({ ...prev, status: undefined, page: 1 }));
    } else if (key === 'pending') {
      setParams((prev) => ({ ...prev, status: 'PENDING', page: 1 }));
    } else if (key === 'approved') {
      setParams((prev) => ({ ...prev, status: 'APPROVED', page: 1 }));
    }
  };

  // Calculate statistics
  const pendingCount = data?.data?.filter((a) => a.status === 'PENDING').length || 0;
  const approvedCount = data?.data?.filter((a) => a.status === 'APPROVED').length || 0;

  const columns: ColumnsType<StockAdjustment> = [
    {
      title: 'Adjustment #',
      dataIndex: 'adjustmentNumber',
      key: 'adjustmentNumber',
      width: 150,
      render: (num: string) => <span className="font-mono">{num}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'adjustmentType',
      key: 'adjustmentType',
      width: 130,
      render: (type: AdjustmentType) => (
        <Tag color={adjustmentTypeColors[type]}>{adjustmentTypeLabels[type]}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Items',
      dataIndex: 'lines',
      key: 'lineCount',
      width: 80,
      align: 'center',
      render: (lines: StockAdjustment['lines']) => lines?.length || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setViewingAdjustment(record)}
          />
          {(record.status === 'PENDING' || record.status === 'DRAFT') && (
            <>
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                className="text-green-500"
                onClick={() => handleApprove(record.id)}
                loading={approveMutation.isPending}
              />
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenRejectModal(record.id)}
              />
            </>
          )}
          {record.status === 'APPROVED' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleConfirm(record.id)}
              loading={confirmMutation.isPending}
            >
              Confirm
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const itemColumns: ColumnsType<AdjustmentItem> = [
    {
      title: 'Item',
      key: 'item',
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
          <div>{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleUpdateItemQuantity(record.key, val || 1)}
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        />
      ),
    },
  ];

  const isPendingApproval = (adjustment: StockAdjustment) =>
    adjustment.status === 'PENDING' || adjustment.status === 'DRAFT';
  const isApproved = (adjustment: StockAdjustment) => adjustment.status === 'APPROVED';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock Adjustments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          New Adjustment
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Approval"
              value={pendingCount}
              prefix={<ClockCircleOutlined className="text-yellow-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Approved (Ready to Confirm)"
              value={approvedCount}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Adjustments"
              value={data?.meta?.total || 0}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            { key: 'all', label: 'All Adjustments' },
            {
              key: 'pending',
              label: (
                <Space>
                  Pending Approval
                  {pendingCount > 0 && (
                    <Tag color="warning">{pendingCount}</Tag>
                  )}
                </Space>
              ),
            },
            {
              key: 'approved',
              label: (
                <Space>
                  Approved
                  {approvedCount > 0 && (
                    <Tag color="success">{approvedCount}</Tag>
                  )}
                </Space>
              ),
            },
          ]}
        />

        <Row gutter={[16, 16]} className="mb-4 mt-4">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Warehouse"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, warehouseId: value, page: 1 }))}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Type"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, type: value, page: 1 }))}
              options={Object.entries(adjustmentTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
        </Row>

        <Table
          dataSource={data?.data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data?.meta?.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} adjustments`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>

      {/* New Adjustment Modal */}
      <Modal
        title="New Stock Adjustment"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="warehouseId"
                label="Warehouse"
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select
                  placeholder="Select warehouse"
                  options={warehouses?.data?.map((w) => ({
                    value: w.id,
                    label: `${w.code} - ${w.name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="adjustmentType"
                label="Adjustment Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select
                  placeholder="Select type"
                  options={Object.entries(adjustmentTypeLabels).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input placeholder="Enter reason for adjustment" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes" />
          </Form.Item>

          <div className="mb-4">
            <Text strong>Items</Text>
            <div className="flex gap-2 mt-2 mb-2">
              <Select
                showSearch
                placeholder="Search and select item..."
                optionFilterProp="label"
                className="flex-1"
                value={selectedItem?.id}
                onChange={(value) => {
                  const item = items?.data?.find((i) => i.id === value);
                  setSelectedItem(item || null);
                }}
                options={items?.data?.map((item) => ({
                  value: item.id,
                  label: `${item.code} - ${item.name}`,
                }))}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
                Add
              </Button>
            </div>
            <Table
              dataSource={adjustmentItems}
              columns={itemColumns}
              rowKey="key"
              pagination={false}
              size="small"
              locale={{ emptyText: 'No items added' }}
            />
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
                disabled={adjustmentItems.length === 0}
              >
                Create Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Adjustment Modal */}
      <Modal
        title={`Adjustment ${viewingAdjustment?.adjustmentNumber}`}
        open={!!viewingAdjustment}
        onCancel={() => setViewingAdjustment(null)}
        footer={
          viewingAdjustment && (
            <div className="flex justify-between">
              <div>
                {isPendingApproval(viewingAdjustment) && (
                  <Space>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleApprove(viewingAdjustment.id)}
                      loading={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleOpenRejectModal(viewingAdjustment.id)}
                    >
                      Reject
                    </Button>
                  </Space>
                )}
                {isApproved(viewingAdjustment) && (
                  <Button
                    type="primary"
                    onClick={() => handleConfirm(viewingAdjustment.id)}
                    loading={confirmMutation.isPending}
                  >
                    Confirm & Apply to Inventory
                  </Button>
                )}
              </div>
              <Button onClick={() => setViewingAdjustment(null)}>Close</Button>
            </div>
          )
        }
        width={700}
      >
        {viewingAdjustment && (
          <div>
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={12}>
                <Text type="secondary">Date:</Text>
                <div>{dayjs(viewingAdjustment.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Warehouse:</Text>
                <div>{viewingAdjustment.warehouseName}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Type:</Text>
                <div>
                  <Tag color={adjustmentTypeColors[viewingAdjustment.adjustmentType]}>
                    {adjustmentTypeLabels[viewingAdjustment.adjustmentType]}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status:</Text>
                <div>
                  <Tag color={statusColors[viewingAdjustment.status] || 'default'}>
                    {statusLabels[viewingAdjustment.status] || viewingAdjustment.status}
                  </Tag>
                </div>
              </Col>
              <Col span={24}>
                <Text type="secondary">Reason:</Text>
                <div>{viewingAdjustment.reason}</div>
              </Col>
              {viewingAdjustment.notes && (
                <Col span={24}>
                  <Text type="secondary">Notes:</Text>
                  <div>{viewingAdjustment.notes}</div>
                </Col>
              )}
            </Row>

            <Divider />

            <Text strong className="block mb-2">Adjustment Items</Text>
            <Table
              dataSource={viewingAdjustment.lines}
              columns={[
                {
                  title: 'Item',
                  key: 'item',
                  render: (_, record) => (
                    <div>
                      <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
                      <div>{record.itemName}</div>
                    </div>
                  ),
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 100,
                  align: 'center',
                  render: (qty: number) => (
                    <Tag color={viewingAdjustment.adjustmentType === 'ADD' ? 'green' : 'red'}>
                      {viewingAdjustment.adjustmentType === 'ADD' ? '+' : '-'}{qty}
                    </Tag>
                  ),
                },
                {
                  title: 'Bin Location',
                  dataIndex: 'binLocationCode',
                  key: 'binLocationCode',
                  width: 120,
                  render: (code: string) => code || '-',
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Adjustment"
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectingId(null);
          rejectForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Alert
            type="warning"
            message="This adjustment will be rejected and marked as invalid."
            className="mb-4"
            showIcon
          />

          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Enter reason for rejecting this adjustment..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingId(null);
                  rejectForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={rejectMutation.isPending}
                icon={<CloseCircleOutlined />}
              >
                Reject Adjustment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

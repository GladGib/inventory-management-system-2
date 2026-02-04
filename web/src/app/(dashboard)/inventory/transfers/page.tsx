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
  Descriptions,
} from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  inventoryService,
  StockTransfer,
  TransferStatus,
  CreateStockTransferRequest,
} from '@/services/inventory-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService, Item } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<TransferStatus, string> = {
  PENDING: 'default',
  IN_TRANSIT: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<TransferStatus, string> = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface TransferItem {
  key: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
}

export default function StockTransfersPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [params, setParams] = useState<{ page: number; limit: number; status?: TransferStatus }>({
    page: 1,
    limit: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTransfer, setViewingTransfer] = useState<StockTransfer | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', params],
    queryFn: () => inventoryService.getStockTransfers(params),
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
    mutationFn: (data: CreateStockTransferRequest) => inventoryService.createStockTransfer(data),
    onSuccess: () => {
      message.success('Stock transfer created successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create transfer');
    },
  });

  const shipMutation = useMutation({
    mutationFn: (id: string) => inventoryService.shipTransfer(id),
    onSuccess: () => {
      message.success('Transfer shipped');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setViewingTransfer(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to ship transfer');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: { itemId: string; receivedQuantity: number }[] }) =>
      inventoryService.receiveTransfer(id, items),
    onSuccess: () => {
      message.success('Transfer received');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setViewingTransfer(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to receive transfer');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => inventoryService.cancelTransfer(id),
    onSuccess: () => {
      message.success('Transfer cancelled');
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      setViewingTransfer(null);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to cancel transfer');
    },
  });

  const handleOpenModal = () => {
    form.resetFields();
    setTransferItems([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
    setTransferItems([]);
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      message.warning('Please select an item');
      return;
    }

    const existingItem = transferItems.find((i) => i.itemId === selectedItem.id);
    if (existingItem) {
      message.warning('Item already added');
      return;
    }

    setTransferItems([
      ...transferItems,
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
    setTransferItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (key: string) => {
    setTransferItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSubmit = (values: any) => {
    if (transferItems.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    if (values.fromWarehouseId === values.toWarehouseId) {
      message.error('Source and destination warehouse must be different');
      return;
    }

    const transferData: CreateStockTransferRequest = {
      fromWarehouseId: values.fromWarehouseId,
      toWarehouseId: values.toWarehouseId,
      notes: values.notes,
      lines: transferItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      })),
    };

    createMutation.mutate(transferData);
  };

  const handleShip = (transfer: StockTransfer) => {
    modal.confirm({
      title: 'Ship Transfer',
      content: 'Are you sure you want to ship this transfer?',
      onOk: () => shipMutation.mutate(transfer.id),
    });
  };

  const handleReceive = (transfer: StockTransfer) => {
    const receiveItems = transfer.lines.map((item) => ({
      itemId: item.itemId,
      receivedQuantity: item.quantity,
    }));
    receiveMutation.mutate({ id: transfer.id, items: receiveItems });
  };

  const handleCancel = (transfer: StockTransfer) => {
    modal.confirm({
      title: 'Cancel Transfer',
      content: 'Are you sure you want to cancel this transfer?',
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutate(transfer.id),
    });
  };

  const columns: ColumnsType<StockTransfer> = [
    {
      title: 'Transfer #',
      dataIndex: 'transferNumber',
      key: 'transferNumber',
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
      title: 'From',
      dataIndex: 'fromWarehouseName',
      key: 'fromWarehouseName',
      ellipsis: true,
    },
    {
      title: '',
      key: 'arrow',
      width: 30,
      render: () => <SwapOutlined />,
    },
    {
      title: 'To',
      dataIndex: 'toWarehouseName',
      key: 'toWarehouseName',
      ellipsis: true,
    },
    {
      title: 'Items',
      dataIndex: 'lines',
      key: 'itemCount',
      width: 80,
      align: 'center',
      render: (lines: StockTransfer['lines']) => lines?.length || 0,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: TransferStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setViewingTransfer(record)}
        />
      ),
    },
  ];

  const itemColumns: ColumnsType<TransferItem> = [
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock Transfers</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
          New Transfer
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, status: value, page: 1 }))}
              options={Object.entries(statusLabels).map(([value, label]) => ({
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
            showTotal: (total) => `Total ${total} transfers`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>

      {/* New Transfer Modal */}
      <Modal
        title="New Stock Transfer"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={11}>
              <Form.Item
                name="fromWarehouseId"
                label="From Warehouse"
                rules={[{ required: true, message: 'Please select source' }]}
              >
                <Select
                  placeholder="Select source"
                  options={warehouses?.data?.map((w) => ({
                    value: w.id,
                    label: `${w.code} - ${w.name}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={2} className="flex items-center justify-center pt-8">
              <SwapOutlined />
            </Col>
            <Col span={11}>
              <Form.Item
                name="toWarehouseId"
                label="To Warehouse"
                rules={[{ required: true, message: 'Please select destination' }]}
              >
                <Select
                  placeholder="Select destination"
                  options={warehouses?.data?.map((w) => ({
                    value: w.id,
                    label: `${w.code} - ${w.name}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Transfer notes" />
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
              dataSource={transferItems}
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
                disabled={transferItems.length === 0}
              >
                Create Transfer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Transfer Modal */}
      <Modal
        title={`Transfer ${viewingTransfer?.transferNumber}`}
        open={!!viewingTransfer}
        onCancel={() => setViewingTransfer(null)}
        footer={null}
        width={700}
      >
        {viewingTransfer && (
          <div>
            <Descriptions column={2} size="small" className="mb-4">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[viewingTransfer.status]}>
                  {statusLabels[viewingTransfer.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {dayjs(viewingTransfer.createdAt).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="From">
                {viewingTransfer.fromWarehouseName}
              </Descriptions.Item>
              <Descriptions.Item label="To">
                {viewingTransfer.toWarehouseName}
              </Descriptions.Item>
              {viewingTransfer.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {viewingTransfer.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Table
              dataSource={viewingTransfer.lines}
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
                },
                {
                  title: 'Received',
                  dataIndex: 'receivedQuantity',
                  key: 'receivedQuantity',
                  width: 100,
                  align: 'center',
                  render: (value) => value ?? '-',
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
            />

            <div className="flex justify-end gap-2 mt-4">
              {viewingTransfer.status === 'PENDING' && (
                <>
                  <Button danger onClick={() => handleCancel(viewingTransfer)}>
                    Cancel Transfer
                  </Button>
                  <Button type="primary" onClick={() => handleShip(viewingTransfer)}>
                    Ship Transfer
                  </Button>
                </>
              )}
              {viewingTransfer.status === 'IN_TRANSIT' && (
                <Button type="primary" onClick={() => handleReceive(viewingTransfer)}>
                  Receive Transfer
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

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
  Divider,
  Steps,
  Skeleton,
  Modal,
  InputNumber,
  Form,
  Input,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TruckOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { salesService, SalesOrder, SalesOrderStatus, SalesOrderItem, PickList, PickListLine, ProcessPickListItem } from '@/services/sales-service';
import { invoicesService } from '@/services/invoices-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<SalesOrderStatus, string> = {
  DRAFT: 'default',
  CONFIRMED: 'blue',
  PROCESSING: 'orange',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<SalesOrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const getStatusStep = (status: SalesOrderStatus): number => {
  const steps: SalesOrderStatus[] = ['DRAFT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  return steps.indexOf(status);
};

export default function SalesOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [shipForm] = Form.useForm();

  const [pickListModalOpen, setPickListModalOpen] = useState(false);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [pickEntries, setPickEntries] = useState<Record<string, number>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesService.getSalesOrder(id),
  });

  const confirmMutation = useMutation({
    mutationFn: () => salesService.confirmOrder(id),
    onSuccess: () => {
      message.success('Order confirmed successfully');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to confirm order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesService.cancelOrder(id),
    onSuccess: () => {
      message.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to cancel order');
    },
  });

  const shipMutation = useMutation({
    mutationFn: () => salesService.shipOrder(id),
    onSuccess: () => {
      message.success('Order marked as shipped');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      setShipmentModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to ship order');
    },
  });

  const deliverMutation = useMutation({
    mutationFn: () => salesService.deliverOrder(id),
    onSuccess: () => {
      message.success('Order marked as delivered');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to mark order as delivered');
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: () => invoicesService.createFromSalesOrder({ salesOrderId: id }),
    onSuccess: (invoice) => {
      message.success('Invoice created successfully');
      router.push(`/sales/invoices/${invoice.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create invoice');
    },
  });

  const { data: pickList, refetch: refetchPickList } = useQuery({
    queryKey: ['pick-list', id],
    queryFn: () => salesService.getPickList(id),
    enabled: !!order && ['CONFIRMED', 'PROCESSING'].includes(order.status),
  });

  const createPickListMutation = useMutation({
    mutationFn: () => salesService.createPickList(id),
    onSuccess: () => {
      message.success('Pick list created');
      refetchPickList();
      setPickListModalOpen(true);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create pick list');
    },
  });

  const processPickListMutation = useMutation({
    mutationFn: (items: ProcessPickListItem[]) => salesService.processPickList(pickList!.id, items),
    onSuccess: () => {
      message.success('Pick list processed');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      refetchPickList();
      setPickListModalOpen(false);
      setPickEntries({});
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to process pick list');
    },
  });

  const handleOpenPickList = () => {
    if (pickList) {
      const entries: Record<string, number> = {};
      pickList.lines.forEach((line) => {
        entries[line.id] = line.pickedQty;
      });
      setPickEntries(entries);
      setPickListModalOpen(true);
    } else {
      createPickListMutation.mutate();
    }
  };

  const handleProcessPickList = () => {
    if (!pickList) return;
    const items: ProcessPickListItem[] = pickList.lines.map((line) => ({
      lineId: line.id,
      pickedQty: pickEntries[line.id] ?? 0,
    }));
    processPickListMutation.mutate(items);
  };

  const handleOpenShipment = () => {
    shipForm.resetFields();
    setShipmentModalOpen(true);
  };

  const handleShipOrder = (values: any) => {
    shipMutation.mutate();
  };

  const handleConfirm = () => {
    modal.confirm({
      title: 'Confirm Order',
      content: 'Are you sure you want to confirm this order? This will allocate stock.',
      okText: 'Confirm',
      onOk: () => confirmMutation.mutate(),
    });
  };

  const handleCancel = () => {
    modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutate(),
    });
  };

  const handleShip = () => {
    modal.confirm({
      title: 'Ship Order',
      content: 'Mark this order as shipped?',
      okText: 'Ship',
      onOk: () => shipMutation.mutate(),
    });
  };

  const handleDeliver = () => {
    modal.confirm({
      title: 'Mark as Delivered',
      content: 'Mark this order as delivered?',
      okText: 'Confirm Delivery',
      onOk: () => deliverMutation.mutate(),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const columns: ColumnsType<SalesOrderItem> = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
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
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (value) => formatCurrency(value),
    },
    {
      title: 'Discount',
      key: 'discount',
      width: 100,
      align: 'right',
      render: (_, record) =>
        record.discountPercent ? `${record.discountPercent}%` : '-',
    },
    {
      title: 'Tax',
      dataIndex: 'taxAmount',
      key: 'tax',
      width: 100,
      align: 'right',
      render: (value) => (value ? formatCurrency(value) : '-'),
    },
    {
      title: 'Line Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value) => formatCurrency(value),
    },
  ];

  if (isLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  const isCancelled = order.status === 'CANCELLED';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <Title level={4} className="mb-0">
              {order.orderNumber}
            </Title>
            <Text type="secondary">
              Created {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </div>
        </div>
        <Space>
          {order.status === 'DRAFT' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => router.push(`/sales/orders/${id}/edit`)}>
                Edit
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleConfirm}
                loading={confirmMutation.isPending}
              >
                Confirm Order
              </Button>
            </>
          )}
          {['CONFIRMED', 'PROCESSING'].includes(order.status) && (
            <Button
              icon={<UnorderedListOutlined />}
              onClick={handleOpenPickList}
              loading={createPickListMutation.isPending}
            >
              {pickList ? 'View Pick List' : 'Create Pick List'}
            </Button>
          )}
          {order.status === 'CONFIRMED' && (
            <Button
              type="primary"
              icon={<TruckOutlined />}
              onClick={handleOpenShipment}
            >
              Create Shipment
            </Button>
          )}
          {order.status === 'SHIPPED' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleDeliver}
              loading={deliverMutation.isPending}
            >
              Mark Delivered
            </Button>
          )}
          {['CONFIRMED', 'PROCESSING'].includes(order.status) && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleCancel}
              loading={cancelMutation.isPending}
            >
              Cancel
            </Button>
          )}
          <Button icon={<PrinterOutlined />}>Print</Button>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => createInvoiceMutation.mutate()}
            loading={createInvoiceMutation.isPending}
          >
            Create Invoice
          </Button>
        </Space>
      </div>

      {!isCancelled && (
        <Card className="mb-6">
          <Steps
            current={getStatusStep(order.status)}
            items={[
              { title: 'Draft' },
              { title: 'Confirmed' },
              { title: 'Processing' },
              { title: 'Shipped' },
              { title: 'Delivered' },
            ]}
          />
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Order Items" className="mb-6">
            <Table
              dataSource={order.lines}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Text strong>Subtotal:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(order.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(order.discountAmount ?? 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <Text type="secondary">Discount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right" className="text-red-500">
                        -{formatCurrency(order.discountAmount ?? 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.taxAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.taxAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Title level={5} className="mb-0">Grand Total:</Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} className="mb-0">
                        {formatCurrency(order.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {order.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{order.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[order.status]}>{statusLabels[order.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(order.orderDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              {order.expectedDate && (
                <Descriptions.Item label="Expected Delivery">
                  {dayjs(order.expectedDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Customer" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{order.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Code">
                <span className="font-mono">{order.customer?.code}</span>
              </Descriptions.Item>
              {order.customer?.phone && (
                <Descriptions.Item label="Phone">{order.customer.phone}</Descriptions.Item>
              )}
              {order.customer?.email && (
                <Descriptions.Item label="Email">{order.customer.email}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Warehouse">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{order.warehouse?.name}</Descriptions.Item>
              <Descriptions.Item label="Code">
                <span className="font-mono">{order.warehouse?.code}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Pick List Modal */}
      <Modal
        title={`Pick List - ${pickList?.pickListNo || order.orderNumber}`}
        open={pickListModalOpen}
        onCancel={() => setPickListModalOpen(false)}
        width={700}
        footer={
          pickList?.status !== 'COMPLETED' ? (
            <Space>
              <Button onClick={() => setPickListModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleProcessPickList}
                loading={processPickListMutation.isPending}
              >
                Complete Picking
              </Button>
            </Space>
          ) : (
            <Button onClick={() => setPickListModalOpen(false)}>Close</Button>
          )
        }
      >
        {pickList && (
          <>
            <div className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Warehouse:</Text>
                  <div>{pickList.warehouseName}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Status:</Text>
                  <div>
                    <Tag color={pickList.status === 'COMPLETED' ? 'success' : 'processing'}>
                      {pickList.status}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </div>

            <Table
              dataSource={pickList.lines}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Item',
                  key: 'item',
                  render: (_, record: PickListLine) => (
                    <div>
                      <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
                      <div>{record.itemName}</div>
                    </div>
                  ),
                },
                {
                  title: 'Bin',
                  dataIndex: 'binLocationCode',
                  key: 'binLocationCode',
                  width: 100,
                  render: (code: string) => code || <Text type="secondary">-</Text>,
                },
                {
                  title: 'Ordered',
                  dataIndex: 'orderedQty',
                  key: 'orderedQty',
                  width: 80,
                  align: 'center',
                },
                {
                  title: 'Picked',
                  key: 'pickedQty',
                  width: 100,
                  render: (_, record: PickListLine) =>
                    pickList.status === 'COMPLETED' ? (
                      <Text>{record.pickedQty}</Text>
                    ) : (
                      <InputNumber
                        min={0}
                        max={record.orderedQty}
                        value={pickEntries[record.id] ?? record.pickedQty}
                        onChange={(val) =>
                          setPickEntries((prev) => ({ ...prev, [record.id]: val || 0 }))
                        }
                        size="small"
                        className="w-full"
                      />
                    ),
                },
              ]}
            />

            {pickList.status !== 'COMPLETED' && (
              <Alert
                type="info"
                message="Enter the actual quantities picked from the warehouse"
                className="mt-4"
                showIcon
              />
            )}
          </>
        )}
      </Modal>

      {/* Shipment Modal */}
      <Modal
        title="Create Shipment"
        open={shipmentModalOpen}
        onCancel={() => setShipmentModalOpen(false)}
        footer={null}
      >
        <Form form={shipForm} layout="vertical" onFinish={handleShipOrder}>
          <Form.Item name="trackingNumber" label="Tracking Number (Optional)">
            <Input placeholder="Enter tracking number" />
          </Form.Item>

          <Form.Item name="carrier" label="Carrier (Optional)">
            <Input placeholder="e.g., Pos Laju, J&T, DHL" />
          </Form.Item>

          <Form.Item name="notes" label="Shipping Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <Alert
            type="warning"
            message="This will mark the order as shipped"
            description="Make sure all items have been picked and packed before creating the shipment."
            className="mb-4"
            showIcon
          />

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setShipmentModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<TruckOutlined />}
                loading={shipMutation.isPending}
              >
                Create Shipment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

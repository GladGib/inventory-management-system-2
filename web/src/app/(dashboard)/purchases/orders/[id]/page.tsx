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
  InputNumber,
  Input,
  DatePicker,
  Steps,
  Progress,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  purchasesService,
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  CreateGRNRequest,
  GoodsReceivedNote,
} from '@/services/purchases-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'default',
  ISSUED: 'blue',
  CONFIRMED: 'cyan',
  PARTIALLY_RECEIVED: 'orange',
  RECEIVED: 'green',
  BILLED: 'purple',
  CLOSED: 'gray',
  CANCELLED: 'red',
};

const statusLabels: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Sent',
  CONFIRMED: 'Confirmed',
  PARTIALLY_RECEIVED: 'Partial',
  RECEIVED: 'Received',
  BILLED: 'Billed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

const getStatusStep = (status: PurchaseOrderStatus): number => {
  const steps: PurchaseOrderStatus[] = ['DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED'];
  const idx = steps.indexOf(status);
  return idx >= 0 ? idx : 0;
};

interface ReceiveFormItem {
  poLineId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  previouslyReceived: number;
  remainingQuantity: number;
  receivedQuantity: number;
}

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [grnForm] = Form.useForm();
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<ReceiveFormItem[]>([]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchasesService.getPurchaseOrder(id),
  });

  const { data: grns } = useQuery({
    queryKey: ['purchase-order-grns', id],
    queryFn: () => purchasesService.getGRNs({ purchaseOrderId: id }),
    enabled: !!order && ['PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status),
  });

  const sendMutation = useMutation({
    mutationFn: () => purchasesService.sendOrder(id),
    onSuccess: () => {
      message.success('Order sent to vendor');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to send order');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchasesService.cancelOrder(id),
    onSuccess: () => {
      message.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to cancel order');
    },
  });

  const grnMutation = useMutation({
    mutationFn: (data: CreateGRNRequest) => purchasesService.createGRN(id, data),
    onSuccess: () => {
      message.success('Goods received successfully');
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order-grns', id] });
      setIsReceiveModalOpen(false);
      grnForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to receive goods');
    },
  });

  const handleCancel = () => {
    modal.confirm({
      title: 'Cancel Order',
      content: 'Are you sure you want to cancel this order?',
      okText: 'Cancel Order',
      okButtonProps: { danger: true },
      onOk: () => cancelMutation.mutate(),
    });
  };

  const handleOpenReceiveModal = () => {
    if (!order) return;

    const items: ReceiveFormItem[] = order.lines.map((line) => ({
      poLineId: line.id,
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      orderedQuantity: line.quantity,
      previouslyReceived: line.quantityReceived || 0,
      remainingQuantity: line.quantity - (line.quantityReceived || 0),
      receivedQuantity: line.quantity - (line.quantityReceived || 0),
    }));

    setReceiveItems(items.filter((i) => i.remainingQuantity > 0));
    grnForm.setFieldsValue({ receivedDate: dayjs() });
    setIsReceiveModalOpen(true);
  };

  const handleUpdateReceiveQuantity = (poLineId: string, quantity: number) => {
    setReceiveItems((prev) =>
      prev.map((item) =>
        item.poLineId === poLineId ? { ...item, receivedQuantity: quantity } : item
      )
    );
  };

  const handleReceiveGoods = (values: any) => {
    const grnData: CreateGRNRequest = {
      receiveDate: values.receivedDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      lines: receiveItems
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          poLineId: item.poLineId,
          quantityReceived: item.receivedQuantity,
        })),
    };

    if (grnData.lines.length === 0) {
      message.error('Please enter quantities for at least one item');
      return;
    }

    grnMutation.mutate(grnData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const getReceivedPercent = (): number => {
    if (!order?.lines || order.lines.length === 0) return 0;
    const totalOrdered = order.lines.reduce((sum, item) => sum + item.quantity, 0);
    const totalReceived = order.lines.reduce((sum, item) => sum + (item.quantityReceived || 0), 0);
    return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  };

  const itemColumns: ColumnsType<PurchaseOrderItem> = [
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
      title: 'Ordered',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center',
    },
    {
      title: 'Received',
      dataIndex: 'quantityReceived',
      key: 'quantityReceived',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <span className={value < record.quantity ? 'text-orange-500' : 'text-green-500'}>
          {value || 0}
        </span>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
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
      key: 'tax',
      width: 80,
      align: 'right',
      render: (_, record) => (record.taxPercent ? `${record.taxPercent}%` : '-'),
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

  const receiveColumns: ColumnsType<ReceiveFormItem> = [
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
      title: 'Ordered',
      dataIndex: 'orderedQuantity',
      key: 'orderedQuantity',
      width: 80,
      align: 'center',
    },
    {
      title: 'Previously Received',
      dataIndex: 'previouslyReceived',
      key: 'previouslyReceived',
      width: 100,
      align: 'center',
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity',
      width: 80,
      align: 'center',
    },
    {
      title: 'Receive Now',
      key: 'receivedQuantity',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.remainingQuantity}
          value={record.receivedQuantity}
          onChange={(val) => handleUpdateReceiveQuantity(record.poLineId, val || 0)}
          size="small"
        />
      ),
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
              {order.poNumber}
            </Title>
            <Text type="secondary">
              Created {dayjs(order.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </div>
        </div>
        <Space>
          {order.status === 'DRAFT' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => router.push(`/purchases/orders/${id}/edit`)}>
                Edit
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => sendMutation.mutate()}
                loading={sendMutation.isPending}
              >
                Send to Vendor
              </Button>
            </>
          )}
          {['ISSUED', 'PARTIALLY_RECEIVED'].includes(order.status) && (
            <Button
              type="primary"
              icon={<InboxOutlined />}
              onClick={handleOpenReceiveModal}
            >
              Receive Goods
            </Button>
          )}
          {!['RECEIVED', 'CANCELLED'].includes(order.status) && (
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
        </Space>
      </div>

      {!isCancelled && (
        <Card className="mb-6">
          <Steps
            current={getStatusStep(order.status)}
            items={[
              { title: 'Draft' },
              { title: 'Sent' },
              { title: 'Partial' },
              { title: 'Received' },
            ]}
          />
        </Card>
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Order Items" className="mb-6">
            <Table
              dataSource={order.lines}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={7} align="right">
                      <Text strong>Subtotal:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(order.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(order.discountAmount ?? 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={7} align="right">
                        <Text type="secondary">Discount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right" className="text-red-500">
                        -{formatCurrency(order.discountAmount ?? 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {order.taxAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={7} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.taxAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={7} align="right">
                      <Title level={5} className="mb-0">Total:</Title>
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

          {grns?.data && grns.data.length > 0 && (
            <Card title="Goods Received Notes" className="mb-6">
              <Timeline
                items={grns.data.map((grn) => ({
                  color: 'green',
                  children: (
                    <div>
                      <div className="flex justify-between">
                        <Text strong>{grn.grnNumber}</Text>
                        <Text type="secondary">{dayjs(grn.receiveDate).format('DD/MM/YYYY')}</Text>
                      </div>
                      <div className="text-sm text-gray-500">
                        {grn.lineCount} item(s) received
                      </div>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

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
                <Descriptions.Item label="Expected Date">
                  {dayjs(order.expectedDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Receiving Progress">
                <Progress
                  percent={getReceivedPercent()}
                  size="small"
                  status={order.status === 'RECEIVED' ? 'success' : 'active'}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Vendor" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{order.vendorName}</Descriptions.Item>
              <Descriptions.Item label="Code">
                <span className="font-mono">{order.vendorCode}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Warehouse">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{order.warehouseName}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Receive Goods Modal */}
      <Modal
        title="Receive Goods"
        open={isReceiveModalOpen}
        onCancel={() => setIsReceiveModalOpen(false)}
        footer={null}
        width={800}
      >
        <Form form={grnForm} layout="vertical" onFinish={handleReceiveGoods}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="receivedDate"
                label="Received Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Notes">
                <Input placeholder="GRN notes" />
              </Form.Item>
            </Col>
          </Row>

          <Table
            dataSource={receiveItems}
            columns={receiveColumns}
            rowKey="poLineId"
            pagination={false}
            size="small"
          />

          <Form.Item className="mb-0 mt-4">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={grnMutation.isPending}>
                Receive Goods
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

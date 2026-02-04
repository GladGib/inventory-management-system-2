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
  Timeline,
  Tooltip,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
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
  EyeOutlined,
  FilePdfOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  salesService,
  SalesOrder,
  SalesOrderStatus,
  SalesOrderItem,
  PickList,
  PickListLine,
  ProcessPickListItem,
  Shipment,
  ShipmentStatus,
} from '@/services/sales-service';
import { invoicesService } from '@/services/invoices-service';
import { apiClient } from '@/lib/api-client';
import { CreateShipmentModal } from '@/components/shipments';
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

const shipmentStatusColors: Record<ShipmentStatus, string> = {
  PENDING: 'default',
  SHIPPED: 'blue',
  DELIVERED: 'green',
};

const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  PENDING: 'Pending',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
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

  const [pickListModalOpen, setPickListModalOpen] = useState(false);
  const [createShipmentModalOpen, setCreateShipmentModalOpen] = useState(false);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [pickEntries, setPickEntries] = useState<Record<string, number>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: ['sales-order', id],
    queryFn: () => salesService.getSalesOrder(id),
  });

  const { data: shipments, refetch: refetchShipments } = useQuery({
    queryKey: ['shipments', id],
    queryFn: () => salesService.getShipments(id),
    enabled: !!order && !['DRAFT'].includes(order.status),
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

  const markShipmentDeliveredMutation = useMutation({
    mutationFn: (shipmentId: string) => salesService.markShipmentDelivered(shipmentId),
    onSuccess: () => {
      message.success('Shipment marked as delivered');
      queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
      refetchShipments();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to mark shipment as delivered');
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

  const handleDeliver = () => {
    modal.confirm({
      title: 'Mark as Delivered',
      content: 'Mark this order as delivered?',
      okText: 'Confirm Delivery',
      onOk: () => deliverMutation.mutate(),
    });
  };

  const handleShipmentCreated = () => {
    message.success('Shipment created successfully');
    queryClient.invalidateQueries({ queryKey: ['sales-order', id] });
    refetchShipments();
  };

  const handleDownloadOrderPdf = async () => {
    try {
      const response = await apiClient.get(`/sales-orders/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-order-${order?.orderNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to download PDF');
    }
  };

  const handlePreviewOrderPdf = () => {
    setPdfPreviewModalOpen(true);
  };

  const handleDownloadDeliveryOrder = async (shipmentId: string, shipmentNumber: string) => {
    try {
      const response = await apiClient.get(`/shipments/${shipmentId}/delivery-order`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DO-${shipmentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to download delivery order');
    }
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
      title: 'Shipped',
      key: 'shipped',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const shipped = record.quantityShipped || 0;
        const total = record.quantity;
        const color = shipped >= total ? 'green' : shipped > 0 ? 'orange' : 'default';
        return (
          <Tag color={color}>
            {shipped}/{total}
          </Tag>
        );
      },
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

  const getShipmentActions = (shipment: Shipment): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'download-do',
        label: 'Download Delivery Order',
        icon: <DownloadOutlined />,
        onClick: () => handleDownloadDeliveryOrder(shipment.id, shipment.shipmentNumber),
      },
    ];

    if (shipment.status === 'SHIPPED') {
      items.push({
        key: 'mark-delivered',
        label: 'Mark as Delivered',
        icon: <CheckCircleOutlined />,
        onClick: () => {
          modal.confirm({
            title: 'Mark as Delivered',
            content: `Mark shipment ${shipment.shipmentNumber} as delivered?`,
            okText: 'Confirm',
            onOk: () => markShipmentDeliveredMutation.mutate(shipment.id),
          });
        },
      });
    }

    return items;
  };

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
  const canCreateShipment = ['CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(order.status);
  const hasUnshippedItems = order.lines.some(
    (line) => (line.quantityShipped || 0) < line.quantity
  );

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
          {canCreateShipment && hasUnshippedItems && (
            <Button
              type="primary"
              icon={<TruckOutlined />}
              onClick={() => setCreateShipmentModalOpen(true)}
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
          <Tooltip title="Preview PDF">
            <Button icon={<EyeOutlined />} onClick={handlePreviewOrderPdf} />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button icon={<DownloadOutlined />} onClick={handleDownloadOrderPdf} />
          </Tooltip>
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

          {/* Shipments History Card */}
          {shipments && shipments.length > 0 && (
            <Card title="Shipments" className="mb-6">
              <Timeline
                items={shipments.map((shipment) => ({
                  color: shipment.status === 'DELIVERED' ? 'green' : 'blue',
                  children: (
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong>{shipment.shipmentNumber}</Text>
                          <Tag color={shipmentStatusColors[shipment.status]}>
                            {shipmentStatusLabels[shipment.status]}
                          </Tag>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {shipment.shipDate
                            ? `Shipped: ${dayjs(shipment.shipDate).format('DD/MM/YYYY')}`
                            : 'Not shipped yet'}
                          {shipment.deliveredDate &&
                            ` | Delivered: ${dayjs(shipment.deliveredDate).format('DD/MM/YYYY')}`}
                        </div>
                        {shipment.carrier && (
                          <div className="text-sm">
                            <Text type="secondary">Carrier:</Text> {shipment.carrier}
                          </div>
                        )}
                        {shipment.trackingNumber && (
                          <div className="text-sm">
                            <Text type="secondary">Tracking:</Text>{' '}
                            <span className="font-mono">{shipment.trackingNumber}</span>
                          </div>
                        )}
                        <div className="mt-2">
                          <Text type="secondary" className="text-xs">Items:</Text>
                          <div className="text-sm">
                            {shipment.lines.map((line) => (
                              <div key={line.id} className="text-gray-600">
                                {line.itemCode} - {line.itemName} x {line.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Dropdown menu={{ items: getShipmentActions(shipment) }} trigger={['click']}>
                        <Button type="text" icon={<MoreOutlined />} size="small" />
                      </Dropdown>
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

      {/* Create Shipment Modal */}
      {order && (
        <CreateShipmentModal
          open={createShipmentModalOpen}
          order={order}
          onClose={() => setCreateShipmentModalOpen(false)}
          onSuccess={handleShipmentCreated}
        />
      )}

      {/* PDF Preview Modal */}
      <Modal
        title={`Sales Order - ${order.orderNumber}`}
        open={pdfPreviewModalOpen}
        onCancel={() => setPdfPreviewModalOpen(false)}
        width={900}
        footer={
          <Space>
            <Button onClick={() => setPdfPreviewModalOpen(false)}>Close</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadOrderPdf}>
              Download PDF
            </Button>
          </Space>
        }
      >
        <div className="h-[70vh]">
          <iframe
            src={`${apiClient.defaults.baseURL}/sales-orders/${id}/pdf`}
            className="w-full h-full border-0"
            title="Sales Order PDF Preview"
          />
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Table,
  Alert,
  Space,
  Button,
  Typography,
  Tag,
} from 'antd';
import { TruckOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  salesService,
  SalesOrder,
  SalesOrderItem,
  CreateShipmentRequest,
  CreateShipmentLineRequest,
} from '@/services/sales-service';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface ShipmentLineEntry {
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  shippedQty: number;
  availableQty: number;
  qtyToShip: number;
}

interface CreateShipmentModalProps {
  open: boolean;
  order: SalesOrder;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateShipmentModal({
  open,
  order,
  onClose,
  onSuccess,
}: CreateShipmentModalProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [shipmentLines, setShipmentLines] = useState<ShipmentLineEntry[]>([]);

  // Initialize shipment lines from order
  useEffect(() => {
    if (open && order) {
      const lines: ShipmentLineEntry[] = order.lines.map((line) => ({
        itemId: line.itemId,
        itemCode: line.itemCode,
        itemName: line.itemName,
        orderedQty: line.quantity,
        shippedQty: line.quantityShipped || 0,
        availableQty: line.quantity - (line.quantityShipped || 0),
        qtyToShip: line.quantity - (line.quantityShipped || 0),
      }));
      setShipmentLines(lines);
      form.resetFields();
    }
  }, [open, order, form]);

  const createShipmentMutation = useMutation({
    mutationFn: (data: CreateShipmentRequest) =>
      salesService.createShipment(order.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['shipments', order.id] });
      onClose();
      onSuccess?.();
    },
  });

  const handleQuantityChange = (itemId: string, qty: number | null) => {
    setShipmentLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId
          ? { ...line, qtyToShip: Math.min(qty || 0, line.availableQty) }
          : line
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Filter lines with quantity to ship > 0
      const linesToShip: CreateShipmentLineRequest[] = shipmentLines
        .filter((line) => line.qtyToShip > 0)
        .map((line) => ({
          itemId: line.itemId,
          quantity: line.qtyToShip,
        }));

      if (linesToShip.length === 0) {
        return;
      }

      const request: CreateShipmentRequest = {
        carrier: values.carrier || undefined,
        trackingNumber: values.trackingNumber || undefined,
        notes: values.notes || undefined,
        lines: linesToShip,
      };

      await createShipmentMutation.mutateAsync(request);
    } catch {
      // Form validation failed
    }
  };

  const hasItemsToShip = shipmentLines.some((line) => line.availableQty > 0);
  const hasSelectedItems = shipmentLines.some((line) => line.qtyToShip > 0);
  const totalItemsToShip = shipmentLines.reduce(
    (sum, line) => sum + line.qtyToShip,
    0
  );

  const columns: ColumnsType<ShipmentLineEntry> = [
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
      dataIndex: 'orderedQty',
      key: 'orderedQty',
      width: 90,
      align: 'center',
    },
    {
      title: 'Shipped',
      dataIndex: 'shippedQty',
      key: 'shippedQty',
      width: 90,
      align: 'center',
      render: (value, record) => (
        <span className={value >= record.orderedQty ? 'text-green-600' : ''}>
          {value}
        </span>
      ),
    },
    {
      title: 'Available',
      dataIndex: 'availableQty',
      key: 'availableQty',
      width: 90,
      align: 'center',
      render: (value) => (
        <Tag color={value > 0 ? 'blue' : 'default'}>{value}</Tag>
      ),
    },
    {
      title: 'Qty to Ship',
      key: 'qtyToShip',
      width: 120,
      render: (_, record) =>
        record.availableQty > 0 ? (
          <InputNumber
            min={0}
            max={record.availableQty}
            value={record.qtyToShip}
            onChange={(val) => handleQuantityChange(record.itemId, val)}
            size="small"
            className="w-full"
          />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <Modal
      title="Create Shipment"
      open={open}
      onCancel={onClose}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<TruckOutlined />}
            onClick={handleSubmit}
            loading={createShipmentMutation.isPending}
            disabled={!hasSelectedItems}
          >
            Create Shipment ({totalItemsToShip} items)
          </Button>
        </Space>
      }
    >
      {!hasItemsToShip ? (
        <Alert
          type="info"
          message="All items have been shipped"
          description="There are no remaining items to ship for this order."
          showIcon
        />
      ) : (
        <>
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="carrier" label="Carrier">
                <Input placeholder="e.g., Pos Laju, J&T, DHL" />
              </Form.Item>

              <Form.Item name="trackingNumber" label="Tracking Number">
                <Input placeholder="Enter tracking number" />
              </Form.Item>
            </div>

            <Form.Item name="notes" label="Shipping Notes">
              <Input.TextArea rows={2} placeholder="Optional notes" />
            </Form.Item>
          </Form>

          <div className="mb-4">
            <Text strong>Items to Ship</Text>
          </div>

          <Table
            dataSource={shipmentLines}
            columns={columns}
            rowKey="itemId"
            pagination={false}
            size="small"
          />

          {createShipmentMutation.isError && (
            <Alert
              type="error"
              message="Failed to create shipment"
              description={
                (createShipmentMutation.error as any)?.response?.data?.error
                  ?.message || 'An error occurred'
              }
              className="mt-4"
              showIcon
            />
          )}

          <Alert
            type="info"
            message="Creating a shipment will update the shipped quantities for the selected items."
            className="mt-4"
            showIcon
          />
        </>
      )}
    </Modal>
  );
}

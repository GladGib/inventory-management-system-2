'use client';

import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Table,
  InputNumber,
  Space,
  App,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import { DeleteOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { purchasesService, CreatePurchaseOrderRequest, CreatePurchaseOrderLineRequest } from '@/services/purchases-service';
import { vendorsService } from '@/services/vendors-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService, Item } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OrderLineItem extends CreatePurchaseOrderLineRequest {
  key: string;
  itemCode?: string;
  itemName?: string;
  discountPercent?: number;
  taxPercent?: number;
  lineTotal: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data: vendors } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => itemsService.getItems({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => purchasesService.createPurchaseOrder(data),
    onSuccess: (order) => {
      message.success('Purchase order created successfully');
      router.push(`/purchases/orders/${order.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create purchase order');
    },
  });

  const calculateLineTotal = (item: Partial<OrderLineItem>): number => {
    const quantity = item.quantity || 0;
    const unitCost = item.unitCost || 0;
    const discountPercent = item.discountPercent || 0;
    const taxPercent = item.taxPercent || 0;

    const subtotal = quantity * unitCost;
    const discount = subtotal * (discountPercent / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxPercent / 100);

    return afterDiscount + tax;
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      message.warning('Please select an item');
      return;
    }

    const existingItem = items.find((i) => i.itemId === selectedItem.id);
    if (existingItem) {
      message.warning('Item already added to order');
      return;
    }

    const newItem: OrderLineItem = {
      key: Date.now().toString(),
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      quantity: selectedItem.reorderQty || 1,
      unitCost: selectedItem.costPrice,
      discountPercent: 0,
      taxPercent: 0,
      lineTotal: selectedItem.costPrice * (selectedItem.reorderQty || 1),
    };

    setItems([...items, newItem]);
    setSelectedItem(null);
  };

  const handleUpdateItem = (key: string, field: keyof OrderLineItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };
          updated.lineTotal = calculateLineTotal(updated);
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleSubmit = (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const orderData: CreatePurchaseOrderRequest = {
      vendorId: values.vendorId,
      warehouseId: values.warehouseId,
      orderDate: values.orderDate?.format('YYYY-MM-DD'),
      expectedDate: values.expectedDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      lines: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        notes: item.notes,
      })),
    };

    createMutation.mutate(orderData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.quantity * item.unitCost * (item.discountPercent || 0) / 100),
    0
  );
  const totalTax = items.reduce((sum, item) => {
    const afterDiscount = item.quantity * item.unitCost * (1 - (item.discountPercent || 0) / 100);
    return sum + afterDiscount * (item.taxPercent || 0) / 100;
  }, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const columns: ColumnsType<OrderLineItem> = [
    {
      title: 'Item',
      key: 'item',
      width: 200,
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
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleUpdateItem(record.key, 'quantity', val || 1)}
          size="small"
        />
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 130,
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => handleUpdateItem(record.key, 'unitCost', val || 0)}
          size="small"
          prefix="RM"
        />
      ),
    },
    {
      title: 'Discount %',
      dataIndex: 'discountPercent',
      key: 'discountPercent',
      width: 100,
      render: (value, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={value}
          onChange={(val) => handleUpdateItem(record.key, 'discountPercent', val || 0)}
          size="small"
          suffix="%"
        />
      ),
    },
    {
      title: 'Tax %',
      dataIndex: 'taxPercent',
      key: 'taxPercent',
      width: 100,
      render: (value, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={2}
          value={value}
          onChange={(val) => handleUpdateItem(record.key, 'taxPercent', val || 0)}
          size="small"
          suffix="%"
        />
      ),
    },
    {
      title: 'Line Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value) => formatCurrency(value),
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
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <Title level={4} className="mb-0">New Purchase Order</Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          orderDate: dayjs(),
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Order Details" className="mb-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="vendorId"
                    label="Vendor"
                    rules={[{ required: true, message: 'Please select a vendor' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select vendor"
                      optionFilterProp="label"
                      options={vendors?.data?.map((v) => ({
                        value: v.id,
                        label: `${v.code} - ${v.name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="warehouseId"
                    label="Receive to Warehouse"
                    rules={[{ required: true, message: 'Please select a warehouse' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select warehouse"
                      optionFilterProp="label"
                      options={warehouses?.data?.map((w) => ({
                        value: w.id,
                        label: `${w.code} - ${w.name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="orderDate" label="Order Date">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="expectedDate" label="Expected Delivery Date">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Order notes" />
              </Form.Item>
            </Card>

            <Card title="Order Items" className="mb-6">
              <div className="flex gap-2 mb-4">
                <Select
                  showSearch
                  placeholder="Search and select item..."
                  optionFilterProp="label"
                  className="flex-1"
                  value={selectedItem?.id}
                  onChange={(value) => {
                    const item = itemsData?.data?.find((i) => i.id === value);
                    setSelectedItem(item || null);
                  }}
                  options={itemsData?.data?.map((item) => ({
                    value: item.id,
                    label: `${item.code} - ${item.name} (Cost: RM${item.costPrice.toFixed(2)})`,
                  }))}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
                  Add
                </Button>
              </div>

              <Table
                dataSource={items}
                columns={columns}
                rowKey="key"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                locale={{ emptyText: 'No items added' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Order Summary" className="sticky top-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text type="secondary">Subtotal:</Text>
                  <Text>{formatCurrency(subtotal)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Discount:</Text>
                  <Text className="text-red-500">-{formatCurrency(totalDiscount)}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Tax:</Text>
                  <Text>{formatCurrency(totalTax)}</Text>
                </div>
                <Divider className="my-3" />
                <div className="flex justify-between">
                  <Text strong>Grand Total:</Text>
                  <Title level={4} className="mb-0">
                    {formatCurrency(grandTotal)}
                  </Title>
                </div>
              </div>

              <Divider />

              <Space direction="vertical" className="w-full">
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={createMutation.isPending}
                  disabled={items.length === 0}
                >
                  Create Order
                </Button>
                <Button block onClick={() => router.back()}>
                  Cancel
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

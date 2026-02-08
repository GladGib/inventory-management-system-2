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
import { salesService, CreateSalesOrderRequest, CreateSalesOrderLineRequest } from '@/services/sales-service';
import { customersService } from '@/services/customers-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService, Item, VariantItem, ItemWithVariants } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OrderLineItem extends CreateSalesOrderLineRequest {
  key: string;
  itemCode?: string;
  itemName?: string;
  variantAttributes?: string;
  taxPercent?: number;
  lineTotal: number;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<OrderLineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [itemVariants, setItemVariants] = useState<ItemWithVariants | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
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
    mutationFn: (data: CreateSalesOrderRequest) => salesService.createSalesOrder(data),
    onSuccess: (order) => {
      message.success('Sales order created successfully');
      router.push(`/sales/orders/${order.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create sales order');
    },
  });

  const calculateLineTotal = (item: Partial<OrderLineItem>): number => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const discountPercent = item.discountPercent || 0;
    const taxPercent = item.taxPercent || 0;

    const subtotal = quantity * unitPrice;
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

    // Check if item is a VARIANT_PARENT - requires variant selection
    if (selectedItem.type === 'VARIANT_PARENT') {
      if (!selectedVariant) {
        message.warning('Please select a variant for this item');
        return;
      }

      const existingItem = items.find((i) => i.itemId === selectedVariant.id);
      if (existingItem) {
        message.warning('This variant is already added to order');
        return;
      }

      // Format variant attributes for display (e.g., "Red / Large")
      const variantAttrDisplay = selectedVariant.attributes
        .map((attr) => attr.value)
        .join(' / ');

      const newItem: OrderLineItem = {
        key: Date.now().toString(),
        itemId: selectedVariant.id,
        itemCode: selectedVariant.code,
        itemName: selectedItem.name,
        variantAttributes: variantAttrDisplay,
        quantity: 1,
        unitPrice: selectedVariant.sellingPrice,
        discountPercent: 0,
        taxPercent: 0,
        lineTotal: selectedVariant.sellingPrice,
      };

      setItems([...items, newItem]);
      setSelectedItem(null);
      setSelectedVariant(null);
      setItemVariants(null);
    } else {
      // Regular item (SIMPLE, VARIANT, BUNDLE)
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
        quantity: 1,
        unitPrice: selectedItem.sellingPrice,
        discountPercent: 0,
        taxPercent: 0,
        lineTotal: selectedItem.sellingPrice,
      };

      setItems([...items, newItem]);
      setSelectedItem(null);
    }
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

  const handleItemSelect = async (itemId: string) => {
    const item = itemsData?.data?.find((i) => i.id === itemId);
    setSelectedItem(item || null);
    setSelectedVariant(null);
    setItemVariants(null);

    if (item && item.type === 'VARIANT_PARENT') {
      setLoadingVariants(true);
      try {
        const variants = await itemsService.getItemVariants(itemId);
        setItemVariants(variants);
      } catch (error: any) {
        message.error(error.response?.data?.error?.message || 'Failed to load variants');
      } finally {
        setLoadingVariants(false);
      }
    }
  };

  const handleSubmit = (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const orderData: CreateSalesOrderRequest = {
      customerId: values.customerId,
      warehouseId: values.warehouseId,
      orderDate: values.orderDate?.format('YYYY-MM-DD'),
      expectedDate: values.expectedDeliveryDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      lines: items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
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

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice ?? 0)), 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + (item.quantity * (item.unitPrice ?? 0) * (item.discountPercent || 0) / 100),
    0
  );
  const totalTax = items.reduce((sum, item) => {
    const afterDiscount = item.quantity * (item.unitPrice ?? 0) * (1 - (item.discountPercent || 0) / 100);
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
          {record.variantAttributes && (
            <div className="text-xs text-blue-600 mt-1">{record.variantAttributes}</div>
          )}
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
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      render: (value, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={value}
          onChange={(val) => handleUpdateItem(record.key, 'unitPrice', val || 0)}
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
        <Title level={4} className="mb-0">New Sales Order</Title>
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
                    name="customerId"
                    label="Customer"
                    rules={[{ required: true, message: 'Please select a customer' }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select customer"
                      optionFilterProp="label"
                      options={customers?.data?.map((c) => ({
                        value: c.id,
                        label: `${c.code} - ${c.name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="warehouseId"
                    label="Warehouse"
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
                  <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Order notes" />
              </Form.Item>
            </Card>

            <Card title="Order Items" className="mb-6">
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <Select
                    showSearch
                    placeholder="Search and select item..."
                    optionFilterProp="label"
                    className="flex-1"
                    value={selectedItem?.id}
                    onChange={handleItemSelect}
                    options={itemsData?.data?.map((item) => ({
                      value: item.id,
                      label: `${item.code} - ${item.name} (RM${item.sellingPrice.toFixed(2)})`,
                    }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
                    Add
                  </Button>
                </div>

                {selectedItem?.type === 'VARIANT_PARENT' && (
                  <div className="mt-2">
                    <Select
                      showSearch
                      placeholder="Select a variant..."
                      optionFilterProp="label"
                      className="w-full"
                      value={selectedVariant?.id}
                      onChange={(value) => {
                        const variant = itemVariants?.variants.find((v) => v.id === value);
                        setSelectedVariant(variant || null);
                      }}
                      loading={loadingVariants}
                      disabled={loadingVariants}
                      options={itemVariants?.variants.map((variant) => {
                        const attrDisplay = variant.attributes
                          .map((attr) => `${attr.attribute}: ${attr.value}`)
                          .join(' | ');
                        return {
                          value: variant.id,
                          label: `${attrDisplay} - RM${variant.sellingPrice.toFixed(2)} (Stock: ${variant.stockOnHand})`,
                        };
                      })}
                    />
                    {!selectedVariant && (
                      <Text type="secondary" className="text-xs mt-1 block">
                        This item has variants. Please select a specific variant before adding.
                      </Text>
                    )}
                  </div>
                )}
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

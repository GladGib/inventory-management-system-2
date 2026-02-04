'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  DatePicker,
  Table,
  Space,
  Row,
  Col,
  Typography,
  App,
  Divider,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  invoicesService,
  CreateInvoiceRequest,
} from '@/services/invoices-service';
import { customersService } from '@/services/customers-service';
import { itemsService, Item } from '@/services/items-service';

const { Text, Title } = Typography;

interface InvoiceLineItem {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
  });

  const { data: itemsData } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => itemsService.getItems({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoicesService.createInvoice(data),
    onSuccess: (result) => {
      message.success('Invoice created successfully');
      router.push(`/sales/invoices/${result.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create invoice');
    },
  });

  const handleAddItem = () => {
    if (!selectedItem) {
      message.warning('Please select an item');
      return;
    }

    const existingItem = items.find((i) => i.itemId === selectedItem.id);
    if (existingItem) {
      message.warning('Item already added. Update quantity instead.');
      return;
    }

    const newItem: InvoiceLineItem = {
      key: Date.now().toString(),
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      quantity: 1,
      unitPrice: selectedItem.sellingPrice || 0,
      discountPercent: 0,
      lineTotal: selectedItem.sellingPrice || 0,
    };

    setItems([...items, newItem]);
    setSelectedItem(null);
  };

  const handleUpdateItem = (key: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };
          const baseTotal = updated.quantity * updated.unitPrice;
          const discount = baseTotal * (updated.discountPercent / 100);
          updated.lineTotal = baseTotal - discount;
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleSubmit = (values: any) => {
    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const invoiceData: CreateInvoiceRequest = {
      customerId: values.customerId,
      invoiceDate: values.invoiceDate?.format('YYYY-MM-DD'),
      paymentTerms: values.paymentTerms,
      discountPercent: values.discountPercent,
      notes: values.notes,
      lines: items.map((item) => ({
        itemId: item.itemId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
      })),
    };

    createMutation.mutate(invoiceData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const overallDiscountPercent = Form.useWatch('discountPercent', form) || 0;
  const discountAmount = subtotal * (overallDiscountPercent / 100);
  const total = subtotal - discountAmount;

  const itemColumns: ColumnsType<InvoiceLineItem> = [
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
      title: 'Description',
      key: 'description',
      width: 200,
      render: (_, record) => (
        <Input
          placeholder="Optional description"
          value={record.description}
          onChange={(e) => handleUpdateItem(record.key, 'description', e.target.value)}
          size="small"
        />
      ),
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 90,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleUpdateItem(record.key, 'quantity', val || 1)}
          className="w-full"
          size="small"
        />
      ),
    },
    {
      title: 'Unit Price',
      key: 'unitPrice',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          step={0.01}
          value={record.unitPrice}
          onChange={(val) => handleUpdateItem(record.key, 'unitPrice', val || 0)}
          className="w-full"
          size="small"
          formatter={(value) => `${value}`}
        />
      ),
    },
    {
      title: 'Discount %',
      key: 'discountPercent',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.discountPercent}
          onChange={(val) => handleUpdateItem(record.key, 'discountPercent', val || 0)}
          className="w-full"
          size="small"
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
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
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/sales/invoices')}
            />
            <span>New Invoice</span>
          </Space>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          invoiceDate: dayjs(),
          paymentTerms: 30,
          discountPercent: 0,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Invoice Details" className="mb-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="customerId"
                    label="Customer"
                    rules={[{ required: true, message: 'Please select customer' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select customer"
                      options={customersData?.data?.map((c) => ({
                        value: c.id,
                        label: `${c.code} - ${c.name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="invoiceDate"
                    label="Invoice Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="paymentTerms"
                    label="Payment Terms (Days)"
                  >
                    <InputNumber min={0} className="w-full" placeholder="e.g. 30" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="discountPercent"
                    label="Overall Discount %"
                  >
                    <InputNumber min={0} max={100} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Optional notes" />
              </Form.Item>
            </Card>

            <Card title="Invoice Items" className="mb-6">
              <div className="mb-4">
                <div className="flex gap-2">
                  <Select
                    showSearch
                    placeholder="Search and select item to add..."
                    optionFilterProp="label"
                    className="flex-1"
                    value={selectedItem?.id}
                    onChange={(value) => {
                      const item = itemsData?.data?.find((i) => i.id === value);
                      setSelectedItem(item || null);
                    }}
                    options={itemsData?.data?.map((item) => ({
                      value: item.id,
                      label: `${item.code} - ${item.name}`,
                    }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
                    Add Item
                  </Button>
                </div>
              </div>

              {items.length > 0 ? (
                <>
                  <Table
                    dataSource={items}
                    columns={itemColumns}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                  />
                  <Divider />
                  <div className="flex justify-end">
                    <div className="w-72 space-y-2">
                      <div className="flex justify-between">
                        <Text>Subtotal:</Text>
                        <Text>{formatCurrency(subtotal)}</Text>
                      </div>
                      {overallDiscountPercent > 0 && (
                        <div className="flex justify-between text-red-500">
                          <Text type="danger">Discount ({overallDiscountPercent}%):</Text>
                          <Text type="danger">-{formatCurrency(discountAmount)}</Text>
                        </div>
                      )}
                      <Divider className="my-2" />
                      <div className="flex justify-between">
                        <Title level={5} className="mb-0">Total:</Title>
                        <Title level={5} className="mb-0">{formatCurrency(total)}</Title>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Empty description="No items added. Select items above to add them to the invoice." />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Text type="secondary">Items:</Text>
                  <Text>{items.length}</Text>
                </div>
                <div className="flex justify-between">
                  <Text type="secondary">Total Quantity:</Text>
                  <Text>{items.reduce((sum, i) => sum + i.quantity, 0)}</Text>
                </div>

                <Divider />

                <div className="flex justify-between">
                  <Text type="secondary">Subtotal:</Text>
                  <Text>{formatCurrency(subtotal)}</Text>
                </div>
                {overallDiscountPercent > 0 && (
                  <div className="flex justify-between">
                    <Text type="secondary">Discount:</Text>
                    <Text type="danger">-{formatCurrency(discountAmount)}</Text>
                  </div>
                )}

                <Divider />

                <div className="flex justify-between">
                  <Title level={4} className="mb-0">Total:</Title>
                  <Title level={4} className="mb-0">{formatCurrency(total)}</Title>
                </div>

                <Divider />

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={createMutation.isPending}
                  disabled={items.length === 0}
                >
                  Create Invoice
                </Button>
                <Button block onClick={() => router.push('/sales/invoices')}>
                  Cancel
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import { billsService, CreateBillRequest, CreateBillItemRequest } from '@/services/bills-service';
import { vendorsService } from '@/services/vendors-service';
import { purchasesService, GRNSummary } from '@/services/purchases-service';

const { Text, Title } = Typography;

interface BillLineItem extends CreateBillItemRequest {
  key: string;
  lineTotal: number;
}

export default function NewBillPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<BillLineItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const { data: grnsData } = useQuery({
    queryKey: ['grns-for-billing', selectedVendorId],
    queryFn: () => purchasesService.getGRNs({
      vendorId: selectedVendorId || undefined,
      status: 'CONFIRMED' as any,
      limit: 50,
    }),
    enabled: !!selectedVendorId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBillRequest) => billsService.createBill(data),
    onSuccess: (bill) => {
      message.success('Bill created successfully');
      router.push(`/purchases/bills/${bill.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create bill');
    },
  });

  const createFromGRNMutation = useMutation({
    mutationFn: (grnId: string) => billsService.createFromGRN(grnId),
    onSuccess: (bill) => {
      message.success('Bill created from GRN');
      router.push(`/purchases/bills/${bill.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create bill from GRN');
    },
  });

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    form.setFieldValue('grnId', undefined);
  };

  const handleAddItem = () => {
    const newItem: BillLineItem = {
      key: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxPercent: 0,
      lineTotal: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleUpdateItem = (key: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };
          const subtotal = updated.quantity * updated.unitPrice;
          const tax = subtotal * ((updated.taxPercent || 0) / 100);
          updated.lineTotal = subtotal + tax;
          return updated;
        }
        return item;
      })
    );
  };

  const handleSubmit = (values: any) => {
    if (values.grnId) {
      createFromGRNMutation.mutate(values.grnId);
      return;
    }

    if (items.length === 0) {
      message.error('Please add at least one item');
      return;
    }

    const billData: CreateBillRequest = {
      vendorId: values.vendorId,
      vendorInvoiceNumber: values.vendorInvoiceNumber,
      billDate: values.billDate?.format('YYYY-MM-DD'),
      dueDate: values.dueDate?.format('YYYY-MM-DD'),
      notes: values.notes,
      items: items.map(({ key, lineTotal, ...item }) => item),
    };

    createMutation.mutate(billData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const totalTax = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * ((item.taxPercent || 0) / 100));
  }, 0);
  const total = subtotal + totalTax;

  const itemColumns: ColumnsType<BillLineItem> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => (
        <Input
          value={record.description}
          onChange={(e) => handleUpdateItem(record.key, 'description', e.target.value)}
          placeholder="Item description"
        />
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => handleUpdateItem(record.key, 'quantity', val || 1)}
          className="w-full"
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 140,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.unitPrice}
          onChange={(val) => handleUpdateItem(record.key, 'unitPrice', val || 0)}
          className="w-full"
          prefix="RM"
        />
      ),
    },
    {
      title: 'Tax %',
      dataIndex: 'taxPercent',
      key: 'taxPercent',
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          precision={0}
          value={record.taxPercent}
          onChange={(val) => handleUpdateItem(record.key, 'taxPercent', val || 0)}
          className="w-full"
          suffix="%"
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
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
              onClick={() => router.push('/purchases/bills')}
            />
            <span>New Bill</span>
          </Space>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          billDate: dayjs(),
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Bill Details" className="mb-6">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="vendorId"
                    label="Vendor"
                    rules={[{ required: true, message: 'Please select vendor' }]}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      placeholder="Select vendor"
                      onChange={handleVendorChange}
                      options={vendorsData?.data?.map((v) => ({
                        value: v.id,
                        label: `${v.name} (${v.code})`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="grnId"
                    label="Create from GRN (Optional)"
                    help="Select a GRN to auto-fill bill items"
                  >
                    <Select
                      allowClear
                      placeholder="Select GRN to create bill from"
                      disabled={!selectedVendorId}
                      options={grnsData?.data?.map((grn: GRNSummary) => ({
                        value: grn.id,
                        label: `${grn.grnNumber} - ${dayjs(grn.receiveDate).format('DD/MM/YYYY')}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name="vendorInvoiceNumber" label="Vendor Invoice #">
                    <Input placeholder="Vendor's invoice number" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="billDate"
                    label="Bill Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="dueDate" label="Due Date">
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Optional notes" />
              </Form.Item>
            </Card>

            <Card
              title="Bill Items"
              extra={
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={handleAddItem}
                >
                  Add Item
                </Button>
              }
              className="mb-6"
            >
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.grnId !== curr.grnId}
              >
                {({ getFieldValue }) =>
                  getFieldValue('grnId') ? (
                    <div className="text-center py-8 text-gray-500">
                      Items will be auto-filled from selected GRN
                    </div>
                  ) : (
                    <>
                      <Table
                        dataSource={items}
                        columns={itemColumns}
                        rowKey="key"
                        pagination={false}
                        size="middle"
                        locale={{ emptyText: 'No items added. Click "Add Item" to begin.' }}
                      />
                      {items.length > 0 && (
                        <>
                          <Divider />
                          <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                              <div className="flex justify-between">
                                <Text type="secondary">Subtotal:</Text>
                                <Text>{formatCurrency(subtotal)}</Text>
                              </div>
                              <div className="flex justify-between">
                                <Text type="secondary">Tax:</Text>
                                <Text>{formatCurrency(totalTax)}</Text>
                              </div>
                              <Divider className="my-2" />
                              <div className="flex justify-between">
                                <Title level={5} className="mb-0">Total:</Title>
                                <Title level={5} className="mb-0">{formatCurrency(total)}</Title>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )
                }
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              <div className="space-y-4">
                <Form.Item noStyle shouldUpdate>
                  {({ getFieldValue }) => {
                    const grnId = getFieldValue('grnId');
                    return grnId ? (
                      <div className="text-center py-4">
                        <Text type="secondary">
                          Bill will be created from selected GRN with auto-filled items
                        </Text>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <Text type="secondary">Subtotal:</Text>
                          <Text>{formatCurrency(subtotal)}</Text>
                        </div>
                        <div className="flex justify-between">
                          <Text type="secondary">Tax:</Text>
                          <Text>{formatCurrency(totalTax)}</Text>
                        </div>
                        <Divider />
                        <div className="flex justify-between">
                          <Title level={4} className="mb-0">Total:</Title>
                          <Title level={4} className="mb-0">{formatCurrency(total)}</Title>
                        </div>
                      </>
                    );
                  }}
                </Form.Item>

                <Divider />

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={createMutation.isPending || createFromGRNMutation.isPending}
                >
                  Create Bill
                </Button>
                <Button block onClick={() => router.push('/purchases/bills')}>
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

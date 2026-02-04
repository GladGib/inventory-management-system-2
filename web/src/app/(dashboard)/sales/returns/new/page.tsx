'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  salesReturnsService,
  CreateSalesReturnRequest,
  ReturnReason,
  returnReasonLabels,
} from '@/services/sales-returns-service';
import { invoicesService, Invoice } from '@/services/invoices-service';
import { customersService } from '@/services/customers-service';

const { Text, Title } = Typography;

interface ReturnLineItem {
  key: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  invoicedQuantity: number;
  unitPrice: number;
  quantity: number;
  reason?: ReturnReason;
  notes?: string;
  lineTotal: number;
}

export default function NewSalesReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<ReturnLineItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const invoiceIdFromUrl = searchParams.get('invoiceId');

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getCustomers({ limit: 100 }),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-for-return', selectedCustomerId],
    queryFn: () => invoicesService.getInvoices({
      customerId: selectedCustomerId || undefined,
      status: 'PAID' as any,
      limit: 50,
    }),
    enabled: !!selectedCustomerId,
  });

  // Load invoice from URL param if present
  const { data: invoiceFromUrl } = useQuery({
    queryKey: ['invoice-for-return', invoiceIdFromUrl],
    queryFn: () => invoicesService.getInvoice(invoiceIdFromUrl!),
    enabled: !!invoiceIdFromUrl,
  });

  useEffect(() => {
    if (invoiceFromUrl) {
      handleInvoiceSelect(invoiceFromUrl.id, invoiceFromUrl);
    }
  }, [invoiceFromUrl]);

  const createMutation = useMutation({
    mutationFn: (data: CreateSalesReturnRequest) => salesReturnsService.createReturn(data),
    onSuccess: (result) => {
      message.success('Return created successfully');
      router.push(`/sales/returns/${result.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create return');
    },
  });

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoice(null);
    setItems([]);
    form.setFieldValue('invoiceId', undefined);
  };

  const handleInvoiceSelect = async (invoiceId: string, invoiceData?: Invoice) => {
    try {
      const invoice = invoiceData || await invoicesService.getInvoice(invoiceId);
      setSelectedInvoice(invoice);

      // Set both customerId and invoiceId in the form
      if (!selectedCustomerId && invoice.customerId) {
        setSelectedCustomerId(invoice.customerId);
        form.setFieldValue('customerId', invoice.customerId);
      }
      form.setFieldValue('invoiceId', invoice.id);

      // Initialize return items from invoice lines
      const returnItems: ReturnLineItem[] = invoice.lines.map((line) => ({
        key: line.id,
        itemId: line.itemId,
        itemCode: line.itemCode || '',
        itemName: line.itemName || '',
        invoicedQuantity: line.quantity,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: line.quantity * line.unitPrice,
      }));
      setItems(returnItems);
    } catch (error) {
      message.error('Failed to load invoice');
    }
  };

  const handleUpdateItem = (key: string, field: string, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };
          updated.lineTotal = updated.quantity * updated.unitPrice;
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
    const itemsToReturn = items.filter((item) => item.quantity > 0);

    if (itemsToReturn.length === 0) {
      message.error('Please add at least one item to return');
      return;
    }

    const returnData: CreateSalesReturnRequest = {
      invoiceId: values.invoiceId,
      returnDate: values.returnDate?.format('YYYY-MM-DD'),
      reason: values.reason,
      notes: values.notes,
      items: itemsToReturn.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        reason: item.reason,
        notes: item.notes,
      })),
    };

    createMutation.mutate(returnData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  const itemColumns: ColumnsType<ReturnLineItem> = [
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
      title: 'Invoiced',
      dataIndex: 'invoicedQuantity',
      key: 'invoicedQuantity',
      width: 90,
      align: 'center',
    },
    {
      title: 'Return Qty',
      key: 'quantity',
      width: 110,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.invoicedQuantity}
          value={record.quantity}
          onChange={(val) => handleUpdateItem(record.key, 'quantity', val || 0)}
          className="w-full"
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right',
      render: (value: number) => formatCurrency(value),
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
      title: 'Reason',
      key: 'reason',
      width: 160,
      render: (_, record) => (
        <Select
          allowClear
          placeholder="Select"
          value={record.reason}
          onChange={(val) => handleUpdateItem(record.key, 'reason', val)}
          className="w-full"
          options={Object.entries(returnReasonLabels).map(([value, label]) => ({
            value,
            label,
          }))}
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
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/sales/returns')}
            />
            <span>New Sales Return</span>
          </Space>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          returnDate: dayjs(),
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Return Details" className="mb-6">
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
                      onChange={handleCustomerChange}
                      options={customersData?.data?.map((c) => ({
                        value: c.id,
                        label: `${c.code} - ${c.name}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="invoiceId"
                    label="Original Invoice"
                    rules={[{ required: true, message: 'Please select invoice' }]}
                  >
                    <Select
                      placeholder="Select invoice"
                      disabled={!selectedCustomerId}
                      onChange={(id) => handleInvoiceSelect(id)}
                      options={invoicesData?.data?.map((inv) => ({
                        value: inv.id,
                        label: `${inv.invoiceNumber} - ${dayjs(inv.invoiceDate).format('DD/MM/YYYY')} - ${formatCurrency(inv.totalAmount)}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="returnDate"
                    label="Return Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="reason" label="Overall Reason">
                    <Select
                      allowClear
                      placeholder="Select reason"
                      options={Object.entries(returnReasonLabels).map(([value, label]) => ({
                        value,
                        label,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Optional notes" />
              </Form.Item>
            </Card>

            <Card title="Return Items" className="mb-6">
              {items.length > 0 ? (
                <>
                  <Table
                    dataSource={items}
                    columns={itemColumns}
                    rowKey="key"
                    pagination={false}
                    size="middle"
                  />
                  <Divider />
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <Title level={5} className="mb-0">Return Total:</Title>
                        <Title level={5} className="mb-0">{formatCurrency(subtotal)}</Title>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <Empty
                  description={
                    selectedInvoice
                      ? 'No items available for return'
                      : 'Select an invoice to view items'
                  }
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              <div className="space-y-4">
                {selectedInvoice && (
                  <div className="bg-gray-50 p-3 rounded">
                    <Text type="secondary" className="text-xs">Original Invoice</Text>
                    <div className="font-mono font-medium">{selectedInvoice.invoiceNumber}</div>
                    <div className="text-sm text-gray-500">
                      {dayjs(selectedInvoice.invoiceDate).format('DD/MM/YYYY')}
                    </div>
                    <div className="text-sm">
                      Original Total: {formatCurrency(selectedInvoice.totalAmount)}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Text type="secondary">Items to Return:</Text>
                  <Text>{items.filter((i) => i.quantity > 0).length}</Text>
                </div>

                <Divider />

                <div className="flex justify-between">
                  <Title level={4} className="mb-0">Return Total:</Title>
                  <Title level={4} className="mb-0">{formatCurrency(subtotal)}</Title>
                </div>

                <Divider />

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={createMutation.isPending}
                  disabled={items.filter((i) => i.quantity > 0).length === 0}
                >
                  Create Return
                </Button>
                <Button block onClick={() => router.push('/sales/returns')}>
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

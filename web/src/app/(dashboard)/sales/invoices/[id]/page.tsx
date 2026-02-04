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
  Select,
  DatePicker,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  SendOutlined,
  DollarOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  invoicesService,
  Invoice,
  InvoiceStatus,
  InvoiceItem,
  Payment,
  RecordPaymentRequest,
} from '@/services/invoices-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOIDED: 'default',
};

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOIDED: 'Voided',
};

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'E_WALLET', label: 'E-Wallet' },
];

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [paymentForm] = Form.useForm();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesService.getInvoice(id),
  });

  const sendMutation = useMutation({
    mutationFn: () => invoicesService.sendInvoice(id),
    onSuccess: () => {
      message.success('Invoice sent successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to send invoice');
    },
  });

  const voidMutation = useMutation({
    mutationFn: () => invoicesService.voidInvoice(id),
    onSuccess: () => {
      message.success('Invoice voided');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to void invoice');
    },
  });

  const paymentMutation = useMutation({
    mutationFn: (data: RecordPaymentRequest) => invoicesService.recordPayment(id, data),
    onSuccess: () => {
      message.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to record payment');
    },
  });

  const handleSend = () => {
    modal.confirm({
      title: 'Send Invoice',
      content: `Send invoice "${invoice?.invoiceNumber}" to ${invoice?.customer?.name}?`,
      okText: 'Send',
      onOk: () => sendMutation.mutate(),
    });
  };

  const handleVoid = () => {
    modal.confirm({
      title: 'Void Invoice',
      content: 'Are you sure you want to void this invoice? This action cannot be undone.',
      okText: 'Void Invoice',
      okButtonProps: { danger: true },
      onOk: () => voidMutation.mutate(),
    });
  };

  const handleOpenPaymentModal = () => {
    paymentForm.setFieldsValue({
      paymentDate: dayjs(),
      amount: invoice?.balanceDue,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (values: any) => {
    paymentMutation.mutate({
      ...values,
      paymentDate: values.paymentDate.format('YYYY-MM-DD'),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const itemColumns: ColumnsType<InvoiceItem> = [
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
          {record.description && <div className="text-xs text-gray-400">{record.description}</div>}
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

  if (isLoading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  const isOverdue = dayjs(invoice.dueDate).isBefore(dayjs()) && !['PAID', 'CANCELLED'].includes(invoice.status);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <Title level={4} className="mb-0">
              {invoice.invoiceNumber}
            </Title>
            <Text type="secondary">
              Created {dayjs(invoice.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </div>
        </div>
        <Space>
          {invoice.status === 'DRAFT' && (
            <>
              <Button icon={<EditOutlined />} onClick={() => router.push(`/sales/invoices/${id}/edit`)}>
                Edit
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sendMutation.isPending}
              >
                Send Invoice
              </Button>
            </>
          )}
          {['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={handleOpenPaymentModal}
            >
              Record Payment
            </Button>
          )}
          {!['PAID', 'CANCELLED'].includes(invoice.status) && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleVoid}
              loading={voidMutation.isPending}
            >
              Void
            </Button>
          )}
          <Button icon={<PrinterOutlined />}>Print</Button>
        </Space>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Invoice Items" className="mb-6">
            <Table
              dataSource={invoice.lines}
              columns={itemColumns}
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
                      {formatCurrency(invoice.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(invoice.discountAmount ?? 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <Text type="secondary">Discount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right" className="text-red-500">
                        -{formatCurrency(invoice.discountAmount ?? 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {(invoice.taxAmount ?? 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={6} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(invoice.taxAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Title level={5} className="mb-0">Total:</Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} className="mb-0">
                        {formatCurrency(invoice.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Text type="secondary">Paid:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right" className="text-green-600">
                      {formatCurrency(invoice.amountPaid)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6} align="right">
                      <Text strong>Balance Due:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong className={invoice.balanceDue > 0 ? 'text-red-500' : ''}>
                        {formatCurrency(invoice.balanceDue)}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {invoice.payments && invoice.payments.length > 0 && (
            <Card title="Payment History" className="mb-6">
              <Timeline
                items={invoice.payments.map((payment) => ({
                  color: 'green',
                  children: (
                    <div>
                      <div className="flex justify-between">
                        <Text strong>{formatCurrency(payment.amount)}</Text>
                        <Text type="secondary">{dayjs(payment.paymentDate).format('DD/MM/YYYY')}</Text>
                      </div>
                      <div>
                        <Tag>{payment.paymentMethod.replace('_', ' ')}</Tag>
                        {payment.referenceNumber && (
                          <Text type="secondary" className="ml-2">Ref: {payment.referenceNumber}</Text>
                        )}
                      </div>
                      {payment.notes && <Text type="secondary">{payment.notes}</Text>}
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

          {invoice.notes && (
            <Card title="Notes" className="mb-6">
              <div>
                <Text type="secondary">Notes:</Text>
                <div>{invoice.notes}</div>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Invoice Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Status">
                <Tag color={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {dayjs(invoice.invoiceDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                <span className={isOverdue ? 'text-red-500' : ''}>
                  {dayjs(invoice.dueDate).format('DD/MM/YYYY')}
                </span>
              </Descriptions.Item>
              {invoice.salesOrderId && (
                <Descriptions.Item label="Sales Order">
                  <Button
                    type="link"
                    size="small"
                    className="p-0"
                    onClick={() => router.push(`/sales/orders/${invoice.salesOrderId}`)}
                  >
                    View Order
                  </Button>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Customer" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{invoice.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="Code">
                <span className="font-mono">{invoice.customer?.code}</span>
              </Descriptions.Item>
              {invoice.customer?.phone && (
                <Descriptions.Item label="Phone">{invoice.customer.phone}</Descriptions.Item>
              )}
              {invoice.customer?.email && (
                <Descriptions.Item label="Email">{invoice.customer.email}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Amount Summary">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Text>Total Amount:</Text>
                <Text strong>{formatCurrency(invoice.totalAmount)}</Text>
              </div>
              <div className="flex justify-between">
                <Text>Paid:</Text>
                <Text className="text-green-600">{formatCurrency(invoice.amountPaid)}</Text>
              </div>
              <div className="flex justify-between border-t pt-3">
                <Text strong>Balance Due:</Text>
                <Title level={4} className={`mb-0 ${invoice.balanceDue > 0 ? 'text-red-500' : ''}`}>
                  {formatCurrency(invoice.balanceDue)}
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Record Payment"
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleRecordPayment}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentDate"
                label="Payment Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  className="w-full"
                  min={0.01}
                  max={invoice.balanceDue}
                  precision={2}
                  prefix="RM"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select method' }]}
              >
                <Select options={paymentMethods} placeholder="Select method" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="referenceNumber" label="Reference Number">
                <Input placeholder="e.g., Cheque number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Payment notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={paymentMutation.isPending}>
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

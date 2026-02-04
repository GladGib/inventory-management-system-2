'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Skeleton,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  App,
  Timeline,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DollarOutlined,
  StopOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import { billsService, Bill, BillLine, BillPayment, BillStatus, RecordPaymentRequest } from '@/services/bills-service';

const { Text, Title } = Typography;

const statusColors: Record<BillStatus, string> = {
  DRAFT: 'default',
  PENDING: 'blue',
  PARTIALLY_PAID: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  VOID: 'gray',
};

const statusLabels: Record<BillStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  VOID: 'Void',
};

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
];

export default function BillDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [paymentForm] = Form.useForm();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: bill, isLoading } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => billsService.getBill(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'payment' && bill) {
      setIsPaymentModalOpen(true);
    }
  }, [searchParams, bill]);

  const paymentMutation = useMutation({
    mutationFn: (data: RecordPaymentRequest) => billsService.recordPayment(id, data),
    onSuccess: () => {
      message.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
      queryClient.invalidateQueries({ queryKey: ['bills-list'] });
      queryClient.invalidateQueries({ queryKey: ['bills-summary'] });
      setIsPaymentModalOpen(false);
      paymentForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to record payment');
    },
  });

  const voidMutation = useMutation({
    mutationFn: () => billsService.voidBill(id),
    onSuccess: () => {
      message.success('Bill voided');
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
      queryClient.invalidateQueries({ queryKey: ['bills-list'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to void bill');
    },
  });

  const handleVoid = () => {
    modal.confirm({
      title: 'Void Bill',
      content: 'Are you sure you want to void this bill? This action cannot be undone.',
      okText: 'Void Bill',
      okButtonProps: { danger: true },
      onOk: () => voidMutation.mutate(),
    });
  };

  const handleOpenPaymentModal = () => {
    paymentForm.setFieldsValue({
      paymentDate: dayjs(),
      amount: bill?.balanceDue || 0,
    });
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = (values: any) => {
    const paymentData: RecordPaymentRequest = {
      paymentDate: values.paymentDate.format('YYYY-MM-DD'),
      amount: values.amount,
      paymentMethod: values.paymentMethod,
      referenceNumber: values.referenceNumber,
      notes: values.notes,
    };
    paymentMutation.mutate(paymentData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const lineColumns: ColumnsType<BillLine> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Tax %',
      dataIndex: 'taxPercent',
      key: 'taxPercent',
      width: 80,
      align: 'right',
      render: (value?: number) => (value ? `${value}%` : '-'),
    },
    {
      title: 'Total',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <Title level={4}>Bill not found</Title>
            <Button type="primary" onClick={() => router.push('/purchases/bills')}>
              Back to List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const paymentProgress = bill.totalAmount > 0
    ? Math.round((bill.paidAmount / bill.totalAmount) * 100)
    : 0;

  const canRecordPayment = ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status);
  const canVoid = bill.status !== 'VOID' && bill.status !== 'PAID';

  return (
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/purchases/bills')}
            />
            <span>Bill: {bill.billNumber}</span>
            <Tag color={statusColors[bill.status]}>{statusLabels[bill.status]}</Tag>
          </Space>
        }
        extra={
          <Space>
            {canRecordPayment && (
              <Button
                type="primary"
                icon={<DollarOutlined />}
                onClick={handleOpenPaymentModal}
              >
                Record Payment
              </Button>
            )}
            {canVoid && (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleVoid}
                loading={voidMutation.isPending}
              >
                Void
              </Button>
            )}
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print
            </Button>
          </Space>
        }
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Bill Items" className="mb-6">
            <Table
              dataSource={bill.lines}
              columns={lineColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text>Subtotal:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(bill.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {bill.discountAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Discount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right" className="text-red-500">
                        -{formatCurrency(bill.discountAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {bill.taxAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(bill.taxAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Title level={5} className="mb-0">Total:</Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} className="mb-0">
                        {formatCurrency(bill.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {bill.payments && bill.payments.length > 0 && (
            <Card title="Payment History" className="mb-6">
              <Timeline
                items={bill.payments.map((payment: BillPayment) => ({
                  color: 'green',
                  children: (
                    <div className="flex justify-between items-start">
                      <div>
                        <Text strong>{formatCurrency(payment.amount)}</Text>
                        <div className="text-sm text-gray-500">
                          {payment.paymentMethod.replace('_', ' ')}
                          {payment.referenceNumber && ` - Ref: ${payment.referenceNumber}`}
                        </div>
                        {payment.notes && (
                          <div className="text-sm text-gray-400">{payment.notes}</div>
                        )}
                      </div>
                      <Text type="secondary">
                        {dayjs(payment.paymentDate).format('DD/MM/YYYY')}
                      </Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

          {bill.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{bill.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Bill Summary" className="mb-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Text type="secondary">Total Amount:</Text>
                <Text strong>{formatCurrency(bill.totalAmount)}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Paid Amount:</Text>
                <Text className="text-green-600">{formatCurrency(bill.paidAmount)}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Balance Due:</Text>
                <Text strong className={bill.balanceDue > 0 ? 'text-red-500' : ''}>
                  {formatCurrency(bill.balanceDue)}
                </Text>
              </div>
              <Progress
                percent={paymentProgress}
                status={bill.status === 'PAID' ? 'success' : 'active'}
                format={(pct) => `${pct}% Paid`}
              />
            </div>
          </Card>

          <Card title="Bill Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Bill Number">
                <Text strong className="font-mono">{bill.billNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[bill.status]}>{statusLabels[bill.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bill Date">
                {dayjs(bill.billDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              {bill.dueDate && (
                <Descriptions.Item label="Due Date">
                  <span className={
                    bill.status !== 'PAID' && dayjs(bill.dueDate).isBefore(dayjs(), 'day')
                      ? 'text-red-500 font-medium'
                      : ''
                  }>
                    {dayjs(bill.dueDate).format('DD/MM/YYYY')}
                  </span>
                </Descriptions.Item>
              )}
              {bill.vendorInvoiceNumber && (
                <Descriptions.Item label="Vendor Invoice #">
                  {bill.vendorInvoiceNumber}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Vendor" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                <Text strong>{bill.vendorName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Code">
                <Text className="font-mono">{bill.vendorCode}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {bill.grnId && (
            <Card title="Related Documents" className="mb-6">
              <Button
                type="link"
                icon={<FileTextOutlined />}
                className="p-0"
                onClick={() => router.push(`/purchases/receiving/${bill.grnId}`)}
              >
                GRN: {bill.grnNumber}
              </Button>
            </Card>
          )}

          <Card title="Timeline" size="small">
            <div className="text-sm text-gray-500">
              <div>Created: {dayjs(bill.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              <div>Updated: {dayjs(bill.updatedAt).format('DD/MM/YYYY HH:mm')}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Record Payment"
        open={isPaymentModalOpen}
        onCancel={() => {
          setIsPaymentModalOpen(false);
          paymentForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={paymentForm}
          layout="vertical"
          onFinish={handleRecordPayment}
        >
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
                rules={[
                  { required: true, message: 'Please enter amount' },
                  {
                    type: 'number',
                    max: bill?.balanceDue || 0,
                    message: `Amount cannot exceed ${formatCurrency(bill?.balanceDue || 0)}`,
                  },
                ]}
              >
                <InputNumber
                  className="w-full"
                  min={0.01}
                  max={bill?.balanceDue || 0}
                  precision={2}
                  formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value!.replace(/RM\s?|(,*)/g, '')) || 0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select method' }]}
          >
            <Select options={paymentMethods} placeholder="Select payment method" />
          </Form.Item>

          <Form.Item name="referenceNumber" label="Reference Number">
            <Input placeholder="Cheque number, transaction ID, etc." />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={paymentMutation.isPending}
              >
                Record Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

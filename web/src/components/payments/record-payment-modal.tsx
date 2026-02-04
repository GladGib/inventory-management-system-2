'use client';

import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Row,
  Col,
  Space,
  Button,
  Typography,
  App,
} from 'antd';
import dayjs from 'dayjs';
import { billsService, RecordPaymentRequest, Bill } from '@/services/bills-service';

const { Text } = Typography;

const paymentMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'OTHER', label: 'Other' },
];

interface RecordPaymentModalProps {
  open: boolean;
  billId: string;
  billNumber: string;
  balanceDue: number;
  vendorName?: string;
  onClose: () => void;
  onSuccess?: (bill: Bill) => void;
}

export function RecordPaymentModal({
  open,
  billId,
  billNumber,
  balanceDue,
  vendorName,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        paymentDate: dayjs(),
        amount: balanceDue,
      });
    }
  }, [open, balanceDue, form]);

  const paymentMutation = useMutation({
    mutationFn: (data: RecordPaymentRequest) => billsService.recordPayment(billId, data),
    onSuccess: (bill) => {
      message.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['bill', billId] });
      queryClient.invalidateQueries({ queryKey: ['bills-list'] });
      queryClient.invalidateQueries({ queryKey: ['bills-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-payments'] });
      handleClose();
      onSuccess?.(bill);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to record payment');
    },
  });

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleSubmit = (values: any) => {
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

  return (
    <Modal
      title="Record Payment"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <div className="flex justify-between mb-1">
          <Text type="secondary">Bill:</Text>
          <Text strong className="font-mono">{billNumber}</Text>
        </div>
        {vendorName && (
          <div className="flex justify-between mb-1">
            <Text type="secondary">Vendor:</Text>
            <Text>{vendorName}</Text>
          </div>
        )}
        <div className="flex justify-between">
          <Text type="secondary">Balance Due:</Text>
          <Text strong className="text-red-500">{formatCurrency(balanceDue)}</Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
                  min: 0.01,
                  message: 'Amount must be greater than 0',
                },
                {
                  type: 'number',
                  max: balanceDue,
                  message: `Amount cannot exceed ${formatCurrency(balanceDue)}`,
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0.01}
                max={balanceDue}
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
          rules={[{ required: true, message: 'Please select payment method' }]}
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
            <Button onClick={handleClose}>Cancel</Button>
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
  );
}

export default RecordPaymentModal;

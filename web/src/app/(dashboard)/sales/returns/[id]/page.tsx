'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Select,
  App,
  Steps,
  Alert,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  DollarOutlined,
  FileTextOutlined,
  EyeOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  salesReturnsService,
  SalesReturn,
  SalesReturnLine,
  ReturnStatus,
  returnStatusLabels,
  returnStatusColors,
  returnReasonLabels,
  ReceiveReturnRequest,
  ProcessRefundRequest,
  CompleteInspectionRequest,
  ItemCondition,
  itemConditionLabels,
  itemConditionColors,
  CreditNote,
} from '@/services/sales-returns-service';
import { warehousesService } from '@/services/warehouses-service';
import { apiClient } from '@/lib/api-client';

const { Text, Title } = Typography;

const refundMethods = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CREDIT', label: 'Store Credit' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ORIGINAL_METHOD', label: 'Original Payment Method' },
];

const conditionOptions = [
  { value: 'RESELLABLE', label: 'Resellable' },
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'DEFECTIVE', label: 'Defective' },
];

const getStatusStep = (status: ReturnStatus): number => {
  const steps: ReturnStatus[] = ['DRAFT', 'PENDING_INSPECTION', 'APPROVED', 'COMPLETED'];
  return steps.indexOf(status);
};

export default function SalesReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [inspectionForm] = Form.useForm();
  const [receiveForm] = Form.useForm();
  const [refundForm] = Form.useForm();

  const { data: returnData, isLoading } = useQuery({
    queryKey: ['sales-return', id],
    queryFn: () => salesReturnsService.getReturn(id),
    enabled: !!id,
  });

  const { data: creditNoteData, refetch: refetchCreditNote } = useQuery({
    queryKey: ['sales-return-credit-note', id],
    queryFn: () => salesReturnsService.getCreditNote(id),
    enabled: !!id && (returnData?.status === 'APPROVED' || returnData?.status === 'COMPLETED'),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 50 }),
  });

  const approveMutation = useMutation({
    mutationFn: () => salesReturnsService.approveReturn(id),
    onSuccess: () => {
      message.success('Return approved');
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) => salesReturnsService.rejectReturn(id, reason),
    onSuccess: () => {
      message.success('Return rejected');
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to reject');
    },
  });

  const inspectionMutation = useMutation({
    mutationFn: (data: CompleteInspectionRequest) => salesReturnsService.completeInspection(id, data),
    onSuccess: () => {
      message.success('Inspection completed');
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
      setIsInspectionModalOpen(false);
      inspectionForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to complete inspection');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (data: ReceiveReturnRequest) => salesReturnsService.receiveReturn(id, data),
    onSuccess: () => {
      message.success('Items received');
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
      setIsReceiveModalOpen(false);
      receiveForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to receive items');
    },
  });

  const refundMutation = useMutation({
    mutationFn: (data: ProcessRefundRequest) => salesReturnsService.processRefund(id, data),
    onSuccess: () => {
      message.success('Refund processed');
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
      setIsRefundModalOpen(false);
      refundForm.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to process refund');
    },
  });

  const generateCreditNoteMutation = useMutation({
    mutationFn: () => salesReturnsService.generateCreditNote(id),
    onSuccess: () => {
      message.success('Credit note generated');
      refetchCreditNote();
      queryClient.invalidateQueries({ queryKey: ['sales-return', id] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to generate credit note');
    },
  });

  const handleApprove = () => {
    modal.confirm({
      title: 'Approve Return',
      content: 'Approve this return request?',
      onOk: () => approveMutation.mutate(),
    });
  };

  const handleReject = () => {
    modal.confirm({
      title: 'Reject Return',
      content: 'Reject this return request?',
      okButtonProps: { danger: true },
      onOk: () => rejectMutation.mutate(undefined),
    });
  };

  const handleOpenInspectionModal = () => {
    if (!returnData) return;
    const initialItems = returnData.lines.map((line) => ({
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      quantity: line.quantity,
      inspectedQuantity: line.quantity,
      condition: 'RESELLABLE' as ItemCondition,
      notes: '',
    }));
    inspectionForm.setFieldsValue({ items: initialItems });
    setIsInspectionModalOpen(true);
  };

  const handleCompleteInspection = (values: any) => {
    const inspectionData: CompleteInspectionRequest = {
      items: values.items.map((item: any) => ({
        itemId: item.itemId,
        inspectedQuantity: item.inspectedQuantity,
        condition: item.condition,
        notes: item.notes,
      })),
      warehouseId: values.warehouseId,
      notes: values.notes,
    };
    inspectionMutation.mutate(inspectionData);
  };

  const handleOpenReceiveModal = () => {
    if (!returnData) return;
    const initialItems = returnData.lines.map((line) => ({
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      quantity: line.quantity,
      receivedQuantity: line.quantity,
      restockable: line.condition === 'RESELLABLE',
    }));
    receiveForm.setFieldsValue({ items: initialItems });
    setIsReceiveModalOpen(true);
  };

  const handleReceive = (values: any) => {
    const receiveData: ReceiveReturnRequest = {
      items: values.items.map((item: any) => ({
        itemId: item.itemId,
        receivedQuantity: item.receivedQuantity,
        condition: item.condition,
        restockable: item.restockable,
      })),
      warehouseId: values.warehouseId,
      notes: values.notes,
    };
    receiveMutation.mutate(receiveData);
  };

  const handleOpenRefundModal = () => {
    if (!returnData) return;
    refundForm.setFieldsValue({
      refundAmount: returnData.totalAmount,
    });
    setIsRefundModalOpen(true);
  };

  const handleRefund = (values: any) => {
    const refundData: ProcessRefundRequest = {
      refundAmount: values.refundAmount,
      refundMethod: values.refundMethod,
      referenceNumber: values.referenceNumber,
      notes: values.notes,
    };
    refundMutation.mutate(refundData);
  };

  const handleGenerateCreditNote = () => {
    modal.confirm({
      title: 'Generate Credit Note',
      content: 'Generate a credit note for this return? This will create an official credit document for the customer.',
      okText: 'Generate',
      onOk: () => generateCreditNoteMutation.mutate(),
    });
  };

  const handleDownloadCreditNotePdf = async () => {
    try {
      const response = await apiClient.get(salesReturnsService.getCreditNotePdfUrl(id), {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit-note-${creditNoteData?.creditNoteNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Failed to download credit note PDF');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const lineColumns: ColumnsType<SalesReturnLine> = [
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
      title: 'Received',
      dataIndex: 'receivedQuantity',
      key: 'receivedQuantity',
      width: 90,
      align: 'center',
      render: (qty?: number) => qty ?? '-',
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      width: 110,
      render: (condition?: ItemCondition) =>
        condition ? (
          <Tag color={itemConditionColors[condition]}>{itemConditionLabels[condition]}</Tag>
        ) : (
          <Text type="secondary">-</Text>
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
      width: 130,
      align: 'right',
      render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 140,
      render: (reason?: string) =>
        reason ? returnReasonLabels[reason as keyof typeof returnReasonLabels] : '-',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <Title level={4}>Return not found</Title>
            <Button type="primary" onClick={() => router.push('/sales/returns')}>
              Back to List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isCancelled = returnData.status === 'CANCELLED';
  const canInspect = returnData.status === 'PENDING_INSPECTION';
  const canApprove = returnData.status === 'PENDING_INSPECTION';
  const canReceive = returnData.status === 'APPROVED';
  const canRefund = returnData.status === 'APPROVED' && !returnData.refundAmount;
  const canGenerateCreditNote = returnData.status === 'APPROVED' && !creditNoteData;
  const hasCreditNote = !!creditNoteData;

  return (
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/sales/returns')}
            />
            <span>Return: {returnData.returnNumber}</span>
            <Tag color={returnStatusColors[returnData.status]}>
              {returnStatusLabels[returnData.status]}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            {canInspect && (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={handleOpenInspectionModal}
              >
                Inspect Items
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleApprove}
                  loading={approveMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleReject}
                  loading={rejectMutation.isPending}
                >
                  Reject
                </Button>
              </>
            )}
            {canReceive && (
              <Button
                type="primary"
                icon={<InboxOutlined />}
                onClick={handleOpenReceiveModal}
              >
                Receive Items
              </Button>
            )}
            {canGenerateCreditNote && (
              <Button
                icon={<FilePdfOutlined />}
                onClick={handleGenerateCreditNote}
                loading={generateCreditNoteMutation.isPending}
              >
                Generate Credit Note
              </Button>
            )}
            {canRefund && (
              <Button
                icon={<DollarOutlined />}
                onClick={handleOpenRefundModal}
              >
                Process Refund
              </Button>
            )}
            {hasCreditNote && (
              <Button
                icon={<FileTextOutlined />}
                onClick={() => setIsCreditNoteModalOpen(true)}
              >
                View Credit Note
              </Button>
            )}
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print
            </Button>
          </Space>
        }
      />

      {!isCancelled && (
        <Card className="mb-6">
          <Steps
            current={getStatusStep(returnData.status)}
            status={returnData.status === 'CANCELLED' ? 'error' : undefined}
            items={[
              { title: 'Draft' },
              { title: 'Pending Inspection' },
              { title: 'Approved' },
              { title: 'Completed' },
            ]}
          />
        </Card>
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Return Items" className="mb-6">
            <Table
              dataSource={returnData.lines}
              columns={lineColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <Text>Subtotal:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(returnData.subtotal)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                  {returnData.taxAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(returnData.taxAmount)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <Title level={5} className="mb-0">Total:</Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} className="mb-0">
                        {formatCurrency(returnData.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </>
              )}
            />
          </Card>

          {returnData.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{returnData.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Return Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Return Number">
                <Text strong className="font-mono">{returnData.returnNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={returnStatusColors[returnData.status]}>
                  {returnStatusLabels[returnData.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Return Date">
                {dayjs(returnData.returnDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              {returnData.reason && (
                <Descriptions.Item label="Reason">
                  {returnReasonLabels[returnData.reason]}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Customer" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                <Text strong>{returnData.customerName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Code">
                <Text className="font-mono">{returnData.customerCode}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Original Invoice" className="mb-6">
            <Button
              type="link"
              icon={<FileTextOutlined />}
              className="p-0"
              onClick={() => router.push(`/sales/invoices/${returnData.invoiceId}`)}
            >
              {returnData.invoiceNumber}
            </Button>
          </Card>

          {returnData.refundAmount && (
            <Card title="Refund Details" className="mb-6">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Refund Amount">
                  <Text strong className="text-green-600">
                    {formatCurrency(returnData.refundAmount)}
                  </Text>
                </Descriptions.Item>
                {returnData.refundMethod && (
                  <Descriptions.Item label="Method">
                    {returnData.refundMethod.replace('_', ' ')}
                  </Descriptions.Item>
                )}
                {returnData.refundReference && (
                  <Descriptions.Item label="Reference">
                    {returnData.refundReference}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}

          {hasCreditNote && (
            <Card title="Credit Note" className="mb-6">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Credit Note #">
                  <Text strong className="font-mono">{creditNoteData.creditNoteNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong className="text-green-600">
                    {formatCurrency(creditNoteData.totalAmount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Date">
                  {dayjs(creditNoteData.creditNoteDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={creditNoteData.status === 'ISSUED' ? 'green' : 'default'}>
                    {creditNoteData.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
              <div className="mt-3">
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadCreditNotePdf}
                >
                  Download PDF
                </Button>
              </div>
            </Card>
          )}

          <Card title="Timeline" size="small">
            <div className="text-sm text-gray-500">
              <div>Created: {dayjs(returnData.createdAt).format('DD/MM/YYYY HH:mm')}</div>
              <div>Updated: {dayjs(returnData.updatedAt).format('DD/MM/YYYY HH:mm')}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Inspection Modal */}
      <Modal
        title="Inspect Returned Items"
        open={isInspectionModalOpen}
        onCancel={() => setIsInspectionModalOpen(false)}
        footer={null}
        width={900}
      >
        <Alert
          message="Inspect each returned item and record its condition"
          description="Mark items as Resellable (can be restocked), Damaged (physical damage), or Defective (functional issues)."
          type="info"
          showIcon
          className="mb-4"
        />

        <Form form={inspectionForm} layout="vertical" onFinish={handleCompleteInspection}>
          <Form.Item name="warehouseId" label="Return to Warehouse">
            <Select
              placeholder="Select warehouse for restocking"
              allowClear
              options={warehousesData?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Form.Item>

          <Form.List name="items">
            {(fields) => (
              <Table
                dataSource={fields.map((field) => ({
                  ...field,
                  ...inspectionForm.getFieldValue(['items', field.name]),
                }))}
                columns={[
                  {
                    title: 'Item',
                    key: 'item',
                    width: 200,
                    render: (_, record) => (
                      <div>
                        <div className="font-mono text-xs">{record.itemCode}</div>
                        <div>{record.itemName}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Return Qty',
                    dataIndex: 'quantity',
                    width: 90,
                    align: 'center',
                  },
                  {
                    title: 'Inspected Qty',
                    key: 'inspectedQuantity',
                    width: 120,
                    render: (_, record) => (
                      <Form.Item
                        name={[record.name, 'inspectedQuantity']}
                        className="mb-0"
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <InputNumber min={0} max={record.quantity} className="w-full" />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Condition',
                    key: 'condition',
                    width: 150,
                    render: (_, record) => (
                      <Form.Item
                        name={[record.name, 'condition']}
                        className="mb-0"
                        rules={[{ required: true, message: 'Required' }]}
                      >
                        <Select options={conditionOptions} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Notes',
                    key: 'notes',
                    render: (_, record) => (
                      <Form.Item
                        name={[record.name, 'notes']}
                        className="mb-0"
                      >
                        <Input placeholder="Inspection notes" />
                      </Form.Item>
                    ),
                  },
                ]}
                rowKey="key"
                pagination={false}
                size="small"
              />
            )}
          </Form.List>

          <Form.Item name="notes" label="Overall Inspection Notes" className="mt-4">
            <Input.TextArea rows={2} placeholder="Optional overall notes about the inspection" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsInspectionModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={inspectionMutation.isPending}>
                Complete Inspection
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Receive Items Modal */}
      <Modal
        title="Receive Returned Items"
        open={isReceiveModalOpen}
        onCancel={() => setIsReceiveModalOpen(false)}
        footer={null}
        width={700}
      >
        <Form form={receiveForm} layout="vertical" onFinish={handleReceive}>
          <Form.Item name="warehouseId" label="Return to Warehouse">
            <Select
              placeholder="Select warehouse"
              options={warehousesData?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Form.Item>

          <Form.List name="items">
            {(fields) => (
              <Table
                dataSource={fields.map((field) => ({
                  ...field,
                  ...receiveForm.getFieldValue(['items', field.name]),
                }))}
                columns={[
                  {
                    title: 'Item',
                    key: 'item',
                    render: (_, record) => (
                      <div>
                        <div className="font-mono text-xs">{record.itemCode}</div>
                        <div>{record.itemName}</div>
                      </div>
                    ),
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    width: 70,
                    align: 'center',
                  },
                  {
                    title: 'Received',
                    key: 'received',
                    width: 100,
                    render: (_, record) => (
                      <Form.Item
                        name={[record.name, 'receivedQuantity']}
                        className="mb-0"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} max={record.quantity} className="w-full" />
                      </Form.Item>
                    ),
                  },
                  {
                    title: 'Restock?',
                    key: 'restockable',
                    width: 100,
                    render: (_, record) => (
                      <Form.Item
                        name={[record.name, 'restockable']}
                        className="mb-0"
                        valuePropName="checked"
                      >
                        <Select
                          options={[
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' },
                          ]}
                        />
                      </Form.Item>
                    ),
                  },
                ]}
                rowKey="key"
                pagination={false}
                size="small"
              />
            )}
          </Form.List>

          <Form.Item name="notes" label="Notes" className="mt-4">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsReceiveModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={receiveMutation.isPending}>
                Receive Items
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Refund Modal */}
      <Modal
        title="Process Refund"
        open={isRefundModalOpen}
        onCancel={() => setIsRefundModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form form={refundForm} layout="vertical" onFinish={handleRefund}>
          <Form.Item
            name="refundAmount"
            label="Refund Amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              max={returnData?.totalAmount || 0}
              precision={2}
              formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => parseFloat(value!.replace(/RM\s?|(,*)/g, '')) || 0}
            />
          </Form.Item>

          <Form.Item
            name="refundMethod"
            label="Refund Method"
            rules={[{ required: true, message: 'Please select method' }]}
          >
            <Select options={refundMethods} placeholder="Select refund method" />
          </Form.Item>

          <Form.Item name="referenceNumber" label="Reference Number">
            <Input placeholder="Transaction reference" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsRefundModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={refundMutation.isPending}>
                Process Refund
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Credit Note Modal */}
      <Modal
        title="Credit Note Details"
        open={isCreditNoteModalOpen}
        onCancel={() => setIsCreditNoteModalOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setIsCreditNoteModalOpen(false)}>Close</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadCreditNotePdf}
            >
              Download PDF
            </Button>
          </Space>
        }
        width={700}
      >
        {creditNoteData && (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="Credit Note #" span={1}>
                <Text strong className="font-mono">{creditNoteData.creditNoteNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Date" span={1}>
                {dayjs(creditNoteData.creditNoteDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Customer" span={1}>
                {creditNoteData.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Customer Code" span={1}>
                <Text className="font-mono">{creditNoteData.customerCode}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Original Invoice" span={1}>
                {creditNoteData.invoiceNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Return #" span={1}>
                {creditNoteData.returnNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag color={creditNoteData.status === 'ISSUED' ? 'green' : 'default'}>
                  {creditNoteData.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Credit Note Items</Title>
            <Table
              dataSource={creditNoteData.lines}
              columns={[
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
                  width: 70,
                  align: 'center',
                },
                {
                  title: 'Condition',
                  dataIndex: 'condition',
                  width: 110,
                  render: (condition: ItemCondition) => (
                    <Tag color={itemConditionColors[condition]}>{itemConditionLabels[condition]}</Tag>
                  ),
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  width: 120,
                  align: 'right',
                  render: (value: number) => formatCurrency(value),
                },
                {
                  title: 'Total',
                  dataIndex: 'lineTotal',
                  width: 130,
                  align: 'right',
                  render: (value: number) => formatCurrency(value),
                },
              ]}
              rowKey="id"
              pagination={false}
              size="small"
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Text>Subtotal:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatCurrency(creditNoteData.subtotal)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {creditNoteData.taxAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <Text type="secondary">Tax:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(creditNoteData.taxAmount)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4} align="right">
                      <Title level={5} className="mb-0">Total Credit:</Title>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} className="mb-0 text-green-600">
                        {formatCurrency(creditNoteData.totalAmount)}
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />

            {creditNoteData.notes && (
              <div className="mt-4">
                <Text type="secondary">Notes:</Text>
                <div>{creditNoteData.notes}</div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}

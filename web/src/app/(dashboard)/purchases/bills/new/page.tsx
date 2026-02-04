'use client';

import { useState, useMemo } from 'react';
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
  Tabs,
  Checkbox,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  billsService,
  CreateBillRequest,
  CreateBillItemRequest,
  CreateConsolidatedBillRequest,
  UnbilledGRN,
} from '@/services/bills-service';
import { vendorsService } from '@/services/vendors-service';

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
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [selectedGrnIds, setSelectedGrnIds] = useState<string[]>([]);

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getVendors({ limit: 100 }),
  });

  const { data: unbilledGrns, isLoading: loadingGrns } = useQuery({
    queryKey: ['unbilled-grns', selectedVendorId],
    queryFn: () => billsService.getUnbilledGRNs({
      vendorId: selectedVendorId || undefined,
      limit: 100,
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

  const createConsolidatedMutation = useMutation({
    mutationFn: (data: CreateConsolidatedBillRequest) => billsService.createConsolidatedBill(data),
    onSuccess: (bill) => {
      message.success('Consolidated bill created successfully');
      router.push(`/purchases/bills/${bill.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create consolidated bill');
    },
  });

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setSelectedGrnIds([]);
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

  const handleGrnSelectionChange = (grnId: string, checked: boolean) => {
    setSelectedGrnIds(prev => {
      if (checked) {
        return [...prev, grnId];
      }
      return prev.filter(id => id !== grnId);
    });
  };

  const handleSelectAllGrns = (checked: boolean) => {
    if (checked && unbilledGrns) {
      setSelectedGrnIds(unbilledGrns.map(grn => grn.id));
    } else {
      setSelectedGrnIds([]);
    }
  };

  const handleSubmit = (values: any) => {
    if (activeTab === 'from-grn') {
      if (selectedGrnIds.length === 0) {
        message.error('Please select at least one GRN');
        return;
      }

      if (selectedGrnIds.length === 1) {
        createFromGRNMutation.mutate(selectedGrnIds[0]);
      } else {
        const consolidatedData: CreateConsolidatedBillRequest = {
          vendorId: values.vendorId,
          grnIds: selectedGrnIds,
          vendorInvoiceNumber: values.vendorInvoiceNumber,
          billDate: values.billDate?.format('YYYY-MM-DD'),
          dueDate: values.dueDate?.format('YYYY-MM-DD'),
          notes: values.notes,
        };
        createConsolidatedMutation.mutate(consolidatedData);
      }
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

  const selectedGrnsTotal = useMemo(() => {
    if (!unbilledGrns) return 0;
    return unbilledGrns
      .filter(grn => selectedGrnIds.includes(grn.id))
      .reduce((sum, grn) => sum + grn.estimatedTotal, 0);
  }, [unbilledGrns, selectedGrnIds]);

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

  const grnColumns: ColumnsType<UnbilledGRN> = [
    {
      title: (
        <Checkbox
          checked={unbilledGrns && unbilledGrns.length > 0 && selectedGrnIds.length === unbilledGrns.length}
          indeterminate={selectedGrnIds.length > 0 && unbilledGrns && selectedGrnIds.length < unbilledGrns.length}
          onChange={(e) => handleSelectAllGrns(e.target.checked)}
        />
      ),
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedGrnIds.includes(record.id)}
          onChange={(e) => handleGrnSelectionChange(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'GRN Number',
      dataIndex: 'grnNumber',
      key: 'grnNumber',
      width: 140,
      render: (grnNumber: string) => (
        <Space>
          <FileTextOutlined />
          <span className="font-mono">{grnNumber}</span>
        </Space>
      ),
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 140,
      render: (poNumber?: string) => poNumber ? (
        <span className="font-mono text-gray-600">{poNumber}</span>
      ) : (
        <Text type="secondary">-</Text>
      ),
    },
    {
      title: 'Receive Date',
      dataIndex: 'receiveDate',
      key: 'receiveDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Items',
      dataIndex: 'lineCount',
      key: 'lineCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Est. Total',
      dataIndex: 'estimatedTotal',
      key: 'estimatedTotal',
      width: 130,
      align: 'right',
      render: (value: number) => formatCurrency(value),
    },
  ];

  const isSubmitting = createMutation.isPending || createFromGRNMutation.isPending || createConsolidatedMutation.isPending;

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
                  <Form.Item name="vendorInvoiceNumber" label="Vendor Invoice #">
                    <Input placeholder="Vendor's invoice number" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
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

            <Card className="mb-6">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'from-grn',
                    label: 'Create from GRN(s)',
                    children: (
                      <div>
                        {!selectedVendorId ? (
                          <Alert
                            message="Select a Vendor"
                            description="Please select a vendor above to see unbilled GRNs."
                            type="info"
                            showIcon
                          />
                        ) : loadingGrns ? (
                          <div className="text-center py-8">Loading unbilled GRNs...</div>
                        ) : unbilledGrns && unbilledGrns.length > 0 ? (
                          <>
                            <Alert
                              message="Select GRNs to Bill"
                              description="Select one or more GRNs below. Selecting multiple GRNs will create a consolidated bill."
                              type="info"
                              showIcon
                              className="mb-4"
                            />
                            <Table
                              dataSource={unbilledGrns}
                              columns={grnColumns}
                              rowKey="id"
                              pagination={false}
                              size="middle"
                              rowClassName={(record) =>
                                selectedGrnIds.includes(record.id) ? 'bg-blue-50' : ''
                              }
                            />
                            {selectedGrnIds.length > 0 && (
                              <div className="mt-4 p-4 bg-gray-50 rounded">
                                <div className="flex justify-between items-center">
                                  <Text>
                                    <strong>{selectedGrnIds.length}</strong> GRN(s) selected
                                    {selectedGrnIds.length > 1 && (
                                      <span className="text-blue-600 ml-2">
                                        (Will create consolidated bill)
                                      </span>
                                    )}
                                  </Text>
                                  <Text strong>
                                    Estimated Total: {formatCurrency(selectedGrnsTotal)}
                                  </Text>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Alert
                            message="No Unbilled GRNs"
                            description="There are no unbilled GRNs for this vendor. All received goods have been billed."
                            type="warning"
                            showIcon
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'manual',
                    label: 'Manual Entry',
                    children: (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <Text type="secondary">Add bill items manually</Text>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddItem}
                          >
                            Add Item
                          </Button>
                        </div>
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
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              <div className="space-y-4">
                {activeTab === 'from-grn' ? (
                  <>
                    <div className="flex justify-between">
                      <Text type="secondary">Selected GRNs:</Text>
                      <Text strong>{selectedGrnIds.length}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text type="secondary">Estimated Total:</Text>
                      <Text strong>{formatCurrency(selectedGrnsTotal)}</Text>
                    </div>
                    {selectedGrnIds.length > 1 && (
                      <Alert
                        message="Consolidated Bill"
                        description="Multiple GRNs selected. A consolidated bill will be created."
                        type="info"
                        showIcon
                      />
                    )}
                  </>
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
                )}

                <Divider />

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={isSubmitting}
                  disabled={
                    (activeTab === 'from-grn' && selectedGrnIds.length === 0) ||
                    (activeTab === 'manual' && items.length === 0)
                  }
                >
                  {activeTab === 'from-grn'
                    ? selectedGrnIds.length > 1
                      ? 'Create Consolidated Bill'
                      : 'Create Bill from GRN'
                    : 'Create Bill'
                  }
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

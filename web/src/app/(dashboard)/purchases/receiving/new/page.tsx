'use client';

import { useState, useEffect } from 'react';
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
  Radio,
  Alert,
  Tooltip,
} from 'antd';
import { DeleteOutlined, PlusOutlined, ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  purchasesService,
  CreateDirectGRNRequest,
  CreateDirectGRNLineRequest,
  CreateGRNRequest,
  PurchaseOrder,
  PurchaseOrderItem,
} from '@/services/purchases-service';
import { vendorsService } from '@/services/vendors-service';
import { warehousesService, BinLocation } from '@/services/warehouses-service';
import { itemsService, Item } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type GRNMode = 'po' | 'direct';

interface DirectGRNLineItem extends CreateDirectGRNLineRequest {
  key: string;
  itemCode?: string;
  itemName?: string;
  lineTotal: number;
}

interface POReceiveLineItem {
  key: string;
  poLineId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  previouslyReceived: number;
  remainingQuantity: number;
  receivedQuantity: number;
  binLocationId?: string;
}

export default function NewGRNPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // Check if we're coming from a specific PO
  const preselectedPOId = searchParams.get('poId');

  const [mode, setMode] = useState<GRNMode>(preselectedPOId ? 'po' : 'direct');
  const [directItems, setDirectItems] = useState<DirectGRNLineItem[]>([]);
  const [poItems, setPOItems] = useState<POReceiveLineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

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

  // Fetch bins for selected warehouse
  const { data: bins } = useQuery({
    queryKey: ['warehouse-bins', selectedWarehouseId],
    queryFn: () => warehousesService.getBinLocations(selectedWarehouseId!),
    enabled: !!selectedWarehouseId,
  });

  // Fetch open POs (ISSUED or PARTIALLY_RECEIVED)
  const { data: openPOs } = useQuery({
    queryKey: ['open-purchase-orders'],
    queryFn: () => purchasesService.getOpenPurchaseOrders(),
    enabled: mode === 'po',
  });

  // Fetch specific PO when preselected
  const { data: preselectedPO } = useQuery({
    queryKey: ['purchase-order', preselectedPOId],
    queryFn: () => purchasesService.getPurchaseOrder(preselectedPOId!),
    enabled: !!preselectedPOId,
  });

  // Handle preselected PO
  useEffect(() => {
    if (preselectedPO && mode === 'po') {
      handleSelectPO(preselectedPO.id);
    }
  }, [preselectedPO]);

  const createDirectGRNMutation = useMutation({
    mutationFn: (data: CreateDirectGRNRequest) => purchasesService.createDirectGRN(data),
    onSuccess: (grn) => {
      message.success('GRN created successfully');
      router.push(`/purchases/receiving/${grn.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create GRN');
    },
  });

  const createPOGRNMutation = useMutation({
    mutationFn: ({ poId, data }: { poId: string; data: CreateGRNRequest }) =>
      purchasesService.createGRN(poId, data),
    onSuccess: (grn) => {
      message.success('GRN created successfully');
      router.push(`/purchases/receiving/${grn.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create GRN');
    },
  });

  const handleSelectPO = (poId: string) => {
    const po = openPOs?.data?.find((p) => p.id === poId) || preselectedPO;
    if (!po) return;

    setSelectedPO(po);
    form.setFieldsValue({
      vendorId: po.vendorId,
      warehouseId: po.warehouseId,
    });
    setSelectedWarehouseId(po.warehouseId || null);

    // Populate line items from PO
    const items: POReceiveLineItem[] = po.lines
      .filter((line) => line.quantity > (line.quantityReceived || 0))
      .map((line) => ({
        key: line.id,
        poLineId: line.id,
        itemId: line.itemId,
        itemCode: line.itemCode,
        itemName: line.itemName,
        orderedQuantity: line.quantity,
        previouslyReceived: line.quantityReceived || 0,
        remainingQuantity: line.quantity - (line.quantityReceived || 0),
        receivedQuantity: line.quantity - (line.quantityReceived || 0), // Default to remaining
        binLocationId: undefined,
      }));

    setPOItems(items);
  };

  const handleAddDirectItem = () => {
    if (!selectedItem) {
      message.warning('Please select an item');
      return;
    }

    const existingItem = directItems.find((i) => i.itemId === selectedItem.id);
    if (existingItem) {
      message.warning('Item already added');
      return;
    }

    const newItem: DirectGRNLineItem = {
      key: Date.now().toString(),
      itemId: selectedItem.id,
      itemCode: selectedItem.code,
      itemName: selectedItem.name,
      quantityReceived: 1,
      unitCost: selectedItem.costPrice,
      lineTotal: selectedItem.costPrice,
    };

    setDirectItems([...directItems, newItem]);
    setSelectedItem(null);
  };

  const handleUpdateDirectItem = (key: string, field: keyof DirectGRNLineItem, value: any) => {
    setDirectItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          const updated = { ...item, [field]: value };
          updated.lineTotal = (updated.quantityReceived || 0) * (updated.unitCost || 0);
          return updated;
        }
        return item;
      })
    );
  };

  const handleRemoveDirectItem = (key: string) => {
    setDirectItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleUpdatePOItem = (key: string, field: keyof POReceiveLineItem, value: any) => {
    setPOItems((prev) =>
      prev.map((item) => {
        if (item.key === key) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = (values: any) => {
    if (mode === 'direct') {
      if (directItems.length === 0) {
        message.error('Please add at least one item');
        return;
      }

      const grnData: CreateDirectGRNRequest = {
        vendorId: values.vendorId,
        warehouseId: values.warehouseId,
        receiveDate: values.receiveDate?.format('YYYY-MM-DD'),
        vendorInvoiceNo: values.vendorInvoiceNo,
        notes: values.notes,
        lines: directItems.map((item) => ({
          itemId: item.itemId,
          quantityReceived: item.quantityReceived,
          unitCost: item.unitCost,
          binLocationId: item.binLocationId,
          notes: item.notes,
        })),
      };

      createDirectGRNMutation.mutate(grnData);
    } else {
      if (!selectedPO) {
        message.error('Please select a purchase order');
        return;
      }

      const receivingItems = poItems.filter((item) => item.receivedQuantity > 0);
      if (receivingItems.length === 0) {
        message.error('Please enter quantities for at least one item');
        return;
      }

      const grnData: CreateGRNRequest = {
        receiveDate: values.receiveDate?.format('YYYY-MM-DD'),
        warehouseId: values.warehouseId,
        notes: values.notes,
        lines: receivingItems.map((item) => ({
          poLineId: item.poLineId,
          quantityReceived: item.receivedQuantity,
          binLocationId: item.binLocationId,
        })),
      };

      createPOGRNMutation.mutate({ poId: selectedPO.id, data: grnData });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const directTotal = directItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalReceiving = poItems.reduce((sum, item) => sum + item.receivedQuantity, 0);

  const directColumns: ColumnsType<DirectGRNLineItem> = [
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
      dataIndex: 'quantityReceived',
      key: 'quantityReceived',
      width: 100,
      render: (value, record) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleUpdateDirectItem(record.key, 'quantityReceived', val || 1)}
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
          onChange={(val) => handleUpdateDirectItem(record.key, 'unitCost', val || 0)}
          size="small"
          prefix="RM"
        />
      ),
    },
    {
      title: 'Bin Location',
      key: 'binLocationId',
      width: 150,
      render: (_, record) => (
        <Select
          placeholder="Select bin"
          allowClear
          size="small"
          className="w-full"
          value={record.binLocationId}
          onChange={(val) => handleUpdateDirectItem(record.key, 'binLocationId', val)}
          disabled={!selectedWarehouseId}
          options={bins?.map((bin) => ({
            value: bin.id,
            label: `${bin.code} - ${bin.name}`,
          }))}
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
          onClick={() => handleRemoveDirectItem(record.key)}
        />
      ),
    },
  ];

  const poColumns: ColumnsType<POReceiveLineItem> = [
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
      title: 'Ordered',
      dataIndex: 'orderedQuantity',
      key: 'orderedQuantity',
      width: 80,
      align: 'center',
    },
    {
      title: (
        <span>
          Previously Received{' '}
          <Tooltip title="Quantity already received in previous GRNs">
            <InfoCircleOutlined className="text-gray-400" />
          </Tooltip>
        </span>
      ),
      dataIndex: 'previouslyReceived',
      key: 'previouslyReceived',
      width: 100,
      align: 'center',
    },
    {
      title: 'Remaining',
      dataIndex: 'remainingQuantity',
      key: 'remainingQuantity',
      width: 90,
      align: 'center',
      render: (value) => <Text type="warning">{value}</Text>,
    },
    {
      title: 'Receive Now',
      key: 'receivedQuantity',
      width: 120,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.remainingQuantity}
          value={record.receivedQuantity}
          onChange={(val) => handleUpdatePOItem(record.key, 'receivedQuantity', val || 0)}
          size="small"
        />
      ),
    },
    {
      title: 'Bin Location',
      key: 'binLocationId',
      width: 150,
      render: (_, record) => (
        <Select
          placeholder="Select bin"
          allowClear
          size="small"
          className="w-full"
          value={record.binLocationId}
          onChange={(val) => handleUpdatePOItem(record.key, 'binLocationId', val)}
          disabled={!selectedWarehouseId}
          options={bins?.map((bin) => ({
            value: bin.id,
            label: `${bin.code} - ${bin.name}`,
          }))}
        />
      ),
    },
  ];

  const isSubmitting = createDirectGRNMutation.isPending || createPOGRNMutation.isPending;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <Title level={4} className="mb-0">
          New Goods Received Note
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          receiveDate: dayjs(),
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* GRN Type Selection */}
            <Card title="GRN Type" className="mb-6">
              <Radio.Group
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setSelectedPO(null);
                  setPOItems([]);
                  setDirectItems([]);
                  form.resetFields(['vendorId', 'warehouseId', 'purchaseOrderId']);
                }}
                disabled={!!preselectedPOId}
              >
                <Radio.Button value="po">Receive Against PO</Radio.Button>
                <Radio.Button value="direct">Direct GRN (No PO)</Radio.Button>
              </Radio.Group>
              {mode === 'direct' && (
                <Alert
                  message="Direct GRN is used for unexpected deliveries or small purchases without a purchase order."
                  type="info"
                  showIcon
                  className="mt-4"
                />
              )}
            </Card>

            {/* GRN Details */}
            <Card title="GRN Details" className="mb-6">
              <Row gutter={16}>
                {mode === 'po' && (
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="purchaseOrderId"
                      label="Purchase Order"
                      rules={[{ required: true, message: 'Please select a purchase order' }]}
                    >
                      <Select
                        showSearch
                        placeholder="Select purchase order"
                        optionFilterProp="label"
                        onChange={handleSelectPO}
                        disabled={!!preselectedPOId}
                        options={openPOs?.data?.map((po) => ({
                          value: po.id,
                          label: `${po.poNumber} - ${po.vendorName}`,
                        }))}
                      />
                    </Form.Item>
                  </Col>
                )}

                {mode === 'direct' && (
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
                )}

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
                      onChange={(value) => setSelectedWarehouseId(value)}
                      disabled={mode === 'po' && !!selectedPO?.warehouseId}
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
                  <Form.Item
                    name="receiveDate"
                    label="Receive Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker className="w-full" format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                {mode === 'direct' && (
                  <Col xs={24} md={12}>
                    <Form.Item name="vendorInvoiceNo" label="Vendor Invoice/DO Number">
                      <Input placeholder="e.g., VDO-12345" />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="GRN notes" />
              </Form.Item>
            </Card>

            {/* Items */}
            <Card title={mode === 'po' ? 'Items to Receive' : 'Received Items'} className="mb-6">
              {mode === 'direct' && (
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
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDirectItem}>
                    Add
                  </Button>
                </div>
              )}

              {mode === 'po' && selectedPO && (
                <Alert
                  message={`Receiving against PO: ${selectedPO.poNumber}`}
                  description={`Vendor: ${selectedPO.vendorName}`}
                  type="info"
                  showIcon
                  className="mb-4"
                />
              )}

              {mode === 'direct' ? (
                <Table
                  dataSource={directItems}
                  columns={directColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  locale={{ emptyText: 'No items added yet' }}
                />
              ) : (
                <Table
                  dataSource={poItems}
                  columns={poColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  scroll={{ x: 800 }}
                  locale={{ emptyText: 'Select a purchase order to see items' }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              {mode === 'direct' ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text type="secondary">Items:</Text>
                    <Text>{directItems.length}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Total Qty:</Text>
                    <Text>
                      {directItems.reduce((sum, item) => sum + item.quantityReceived, 0)}
                    </Text>
                  </div>
                  <Divider className="my-3" />
                  <div className="flex justify-between">
                    <Text strong>Total Value:</Text>
                    <Title level={4} className="mb-0">
                      {formatCurrency(directTotal)}
                    </Title>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text type="secondary">PO Number:</Text>
                    <Text strong>{selectedPO?.poNumber || '-'}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text type="secondary">Items to Receive:</Text>
                    <Text>{poItems.filter((i) => i.receivedQuantity > 0).length}</Text>
                  </div>
                  <Divider className="my-3" />
                  <div className="flex justify-between">
                    <Text strong>Total Qty Receiving:</Text>
                    <Title level={4} className="mb-0">
                      {totalReceiving}
                    </Title>
                  </div>
                </div>
              )}

              <Divider />

              <Space direction="vertical" className="w-full">
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={
                    mode === 'direct'
                      ? directItems.length === 0
                      : !selectedPO || poItems.filter((i) => i.receivedQuantity > 0).length === 0
                  }
                >
                  Create GRN
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

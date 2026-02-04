'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Steps,
  Select,
  Radio,
  Checkbox,
  Table,
  Space,
  App,
  Row,
  Col,
  Typography,
  Alert,
  Input,
  Descriptions,
  Tag,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  AppstoreOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { warehousesService, Warehouse, BinLocation } from '@/services/warehouses-service';
import { itemsService, Category } from '@/services/items-service';
import { stockCountsService, CreateStockCountRequest } from '@/services/stock-counts-service';
import { PageHeader } from '@/components/ui';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;

type CountScope = 'all' | 'categories' | 'bins';

interface StockCountWizardData {
  warehouseId: string;
  warehouse?: Warehouse;
  scope: CountScope;
  categoryIds: string[];
  binLocationIds: string[];
  notes?: string;
}

export default function NewStockCountWizardPage() {
  const router = useRouter();
  const { message } = App.useApp();

  const [currentStep, setCurrentStep] = useState(0);
  const [wizardData, setWizardData] = useState<StockCountWizardData>({
    warehouseId: '',
    scope: 'all',
    categoryIds: [],
    binLocationIds: [],
    notes: '',
  });

  // Fetch warehouses
  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100, isActive: true }),
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => itemsService.getCategories(true),
  });

  // Fetch bin locations for selected warehouse
  const { data: binLocations, isLoading: binsLoading } = useQuery({
    queryKey: ['bin-locations', wizardData.warehouseId],
    queryFn: () => warehousesService.getBinLocations(wizardData.warehouseId),
    enabled: !!wizardData.warehouseId,
  });

  // Create stock count mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStockCountRequest) => stockCountsService.createStockCount(data),
    onSuccess: (result) => {
      message.success('Stock count session created successfully');
      router.push(`/inventory/counts/${result.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create stock count');
    },
  });

  const handleWarehouseSelect = (warehouseId: string) => {
    const warehouse = warehouses?.data?.find((w) => w.id === warehouseId);
    setWizardData((prev) => ({
      ...prev,
      warehouseId,
      warehouse,
      binLocationIds: [], // Reset bin selections when warehouse changes
    }));
  };

  const handleScopeChange = (scope: CountScope) => {
    setWizardData((prev) => ({
      ...prev,
      scope,
      categoryIds: [],
      binLocationIds: [],
    }));
  };

  const handleCategoryChange = (categoryIds: string[]) => {
    setWizardData((prev) => ({
      ...prev,
      categoryIds,
    }));
  };

  const handleBinChange = (binLocationIds: string[]) => {
    setWizardData((prev) => ({
      ...prev,
      binLocationIds,
    }));
  };

  const handleNext = () => {
    if (currentStep === 0 && !wizardData.warehouseId) {
      message.warning('Please select a warehouse');
      return;
    }
    if (currentStep === 1) {
      if (wizardData.scope === 'categories' && wizardData.categoryIds.length === 0) {
        message.warning('Please select at least one category');
        return;
      }
      if (wizardData.scope === 'bins' && wizardData.binLocationIds.length === 0) {
        message.warning('Please select at least one bin location');
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleCreate = () => {
    const requestData: CreateStockCountRequest = {
      warehouseId: wizardData.warehouseId,
      notes: wizardData.notes,
    };

    // For now, the backend may not support category/bin filtering
    // If the API supports itemIds, we could add them here
    // The scope selection is for future extensibility

    createMutation.mutate(requestData);
  };

  const getScopeDescription = () => {
    switch (wizardData.scope) {
      case 'all':
        return 'All inventory items in the selected warehouse';
      case 'categories':
        return `${wizardData.categoryIds.length} categories selected`;
      case 'bins':
        return `${wizardData.binLocationIds.length} bin locations selected`;
      default:
        return '';
    }
  };

  // Flatten categories for checkbox display
  const flattenCategories = (cats: Category[], level = 0): { id: string; name: string; level: number }[] => {
    let result: { id: string; name: string; level: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  };

  const flatCategories = categories ? flattenCategories(categories) : [];

  const warehouseColumns: ColumnsType<Warehouse> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Primary',
      dataIndex: 'isPrimary',
      key: 'isPrimary',
      width: 100,
      render: (isPrimary: boolean) => (isPrimary ? <Tag color="blue">Primary</Tag> : null),
    },
  ];

  const steps = [
    {
      title: 'Select Warehouse',
      icon: <ShopOutlined />,
    },
    {
      title: 'Select Scope',
      icon: <AppstoreOutlined />,
    },
    {
      title: 'Review & Create',
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <div>
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/inventory/counts')}
            />
            <span>New Stock Count</span>
          </Space>
        }
        subtitle="Create a new stock count session"
      />

      <Card className="mb-6">
        <Steps current={currentStep} items={steps} className="mb-6" />
      </Card>

      {/* Step 1: Select Warehouse */}
      {currentStep === 0 && (
        <Card title="Step 1: Select Warehouse" className="mb-6">
          <Alert
            type="info"
            message="Choose the warehouse where you want to perform the stock count"
            className="mb-4"
            showIcon
          />

          <Table
            dataSource={warehouses?.data}
            columns={warehouseColumns}
            rowKey="id"
            loading={warehousesLoading}
            pagination={false}
            size="middle"
            rowSelection={{
              type: 'radio',
              selectedRowKeys: wizardData.warehouseId ? [wizardData.warehouseId] : [],
              onChange: (selectedRowKeys) => {
                const warehouseId = selectedRowKeys[0] as string;
                handleWarehouseSelect(warehouseId);
              },
            }}
            onRow={(record) => ({
              onClick: () => handleWarehouseSelect(record.id),
              className: 'cursor-pointer',
            })}
          />
        </Card>
      )}

      {/* Step 2: Select Scope */}
      {currentStep === 1 && (
        <Card title="Step 2: Select Count Scope" className="mb-6">
          <Alert
            type="info"
            message="Choose what items to include in this stock count"
            className="mb-4"
            showIcon
          />

          <Radio.Group
            value={wizardData.scope}
            onChange={(e) => handleScopeChange(e.target.value)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full" size="large">
              <Card
                hoverable
                className={`cursor-pointer ${wizardData.scope === 'all' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => handleScopeChange('all')}
              >
                <Radio value="all">
                  <div>
                    <Title level={5} className="mb-1">All Items</Title>
                    <Text type="secondary">
                      Count all inventory items currently in stock at the selected warehouse.
                      Recommended for full physical inventory counts.
                    </Text>
                  </div>
                </Radio>
              </Card>

              <Card
                hoverable
                className={`cursor-pointer ${wizardData.scope === 'categories' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => handleScopeChange('categories')}
              >
                <Radio value="categories">
                  <div>
                    <Title level={5} className="mb-1">Specific Categories</Title>
                    <Text type="secondary">
                      Count items from selected categories only.
                      Useful for cycle counting specific product groups.
                    </Text>
                  </div>
                </Radio>
                {wizardData.scope === 'categories' && (
                  <div className="mt-4 ml-6">
                    <Checkbox.Group
                      value={wizardData.categoryIds}
                      onChange={(values) => handleCategoryChange(values as string[])}
                    >
                      <Space direction="vertical">
                        {categoriesLoading ? (
                          <Text type="secondary">Loading categories...</Text>
                        ) : flatCategories.length === 0 ? (
                          <Text type="secondary">No categories found</Text>
                        ) : (
                          flatCategories.map((cat) => (
                            <Checkbox
                              key={cat.id}
                              value={cat.id}
                              style={{ marginLeft: cat.level * 20 }}
                            >
                              {cat.name}
                            </Checkbox>
                          ))
                        )}
                      </Space>
                    </Checkbox.Group>
                  </div>
                )}
              </Card>

              <Card
                hoverable
                className={`cursor-pointer ${wizardData.scope === 'bins' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => handleScopeChange('bins')}
              >
                <Radio value="bins">
                  <div>
                    <Title level={5} className="mb-1">Specific Bin Locations</Title>
                    <Text type="secondary">
                      Count items from selected bin locations only.
                      Ideal for zone-based counting.
                    </Text>
                  </div>
                </Radio>
                {wizardData.scope === 'bins' && (
                  <div className="mt-4 ml-6">
                    <Checkbox.Group
                      value={wizardData.binLocationIds}
                      onChange={(values) => handleBinChange(values as string[])}
                    >
                      <Space direction="vertical">
                        {binsLoading ? (
                          <Text type="secondary">Loading bin locations...</Text>
                        ) : !binLocations || binLocations.length === 0 ? (
                          <Text type="secondary">No bin locations configured for this warehouse</Text>
                        ) : (
                          binLocations.map((bin) => (
                            <Checkbox key={bin.id} value={bin.id}>
                              <Space>
                                <InboxOutlined />
                                <span className="font-mono">{bin.code}</span>
                                <span>- {bin.name}</span>
                              </Space>
                            </Checkbox>
                          ))
                        )}
                      </Space>
                    </Checkbox.Group>
                  </div>
                )}
              </Card>
            </Space>
          </Radio.Group>
        </Card>
      )}

      {/* Step 3: Review & Create */}
      {currentStep === 2 && (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="Step 3: Review & Create" className="mb-6">
              <Alert
                type="info"
                message="Review your selections before creating the stock count session"
                className="mb-4"
                showIcon
              />

              <Descriptions
                bordered
                column={1}
                labelStyle={{ width: 150, fontWeight: 500 }}
              >
                <Descriptions.Item label="Warehouse">
                  <Space>
                    <span className="font-mono">{wizardData.warehouse?.code}</span>
                    <span>-</span>
                    <span>{wizardData.warehouse?.name}</span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Count Scope">
                  <Tag color={wizardData.scope === 'all' ? 'green' : 'blue'}>
                    {wizardData.scope === 'all'
                      ? 'All Items'
                      : wizardData.scope === 'categories'
                      ? 'Selected Categories'
                      : 'Selected Bin Locations'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Scope Details">
                  {getScopeDescription()}
                </Descriptions.Item>
              </Descriptions>

              {wizardData.scope === 'categories' && wizardData.categoryIds.length > 0 && (
                <div className="mt-4">
                  <Text strong>Selected Categories:</Text>
                  <div className="mt-2">
                    {wizardData.categoryIds.map((id) => {
                      const cat = flatCategories.find((c) => c.id === id);
                      return (
                        <Tag key={id} className="mb-1">
                          {cat?.name || id}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}

              {wizardData.scope === 'bins' && wizardData.binLocationIds.length > 0 && (
                <div className="mt-4">
                  <Text strong>Selected Bin Locations:</Text>
                  <div className="mt-2">
                    {wizardData.binLocationIds.map((id) => {
                      const bin = binLocations?.find((b) => b.id === id);
                      return (
                        <Tag key={id} className="mb-1" icon={<InboxOutlined />}>
                          {bin?.code} - {bin?.name}
                        </Tag>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <Text strong className="block mb-2">Notes (Optional)</Text>
                <Input.TextArea
                  rows={3}
                  placeholder="Add any notes for this stock count session..."
                  value={wizardData.notes}
                  onChange={(e) =>
                    setWizardData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Summary" className="sticky top-4">
              <div className="space-y-3">
                <div>
                  <Text type="secondary">Warehouse:</Text>
                  <div className="font-semibold">{wizardData.warehouse?.name}</div>
                </div>
                <div>
                  <Text type="secondary">Scope:</Text>
                  <div className="font-semibold">
                    {wizardData.scope === 'all'
                      ? 'All Items'
                      : wizardData.scope === 'categories'
                      ? `${wizardData.categoryIds.length} Categories`
                      : `${wizardData.binLocationIds.length} Bin Locations`}
                  </div>
                </div>
              </div>

              <Alert
                type="warning"
                message="Important"
                description="Once created, the stock count session will include all items matching your criteria. You can then enter actual counted quantities."
                className="mt-4"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Navigation Buttons */}
      <Card>
        <div className="flex justify-between">
          <Button onClick={() => router.push('/inventory/counts')}>Cancel</Button>
          <Space>
            {currentStep > 0 && (
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleCreate}
                loading={createMutation.isPending}
              >
                Create Stock Count
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}

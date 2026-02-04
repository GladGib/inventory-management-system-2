'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Select,
  Input,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
  Tag,
  Modal,
  List,
  Empty,
  Spin,
  Button,
} from 'antd';
import {
  SearchOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  warehousesService,
  BinLocation,
  BinStockLevel,
  WarehouseStockLevel,
} from '@/services/warehouses-service';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface BinWithStock extends BinLocation {
  items: WarehouseStockLevel[];
  totalQuantity: number;
  itemCount: number;
}

export default function StockByBinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialWarehouseId = searchParams.get('warehouseId') || undefined;
  const initialBinId = searchParams.get('binId') || undefined;

  const [warehouseId, setWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [searchText, setSearchText] = useState('');
  const [selectedBin, setSelectedBin] = useState<BinWithStock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  // Fetch bins for selected warehouse or all warehouses
  const selectedWarehouseIds = warehouseId
    ? [warehouseId]
    : (warehouses?.data?.map((w) => w.id) || []);

  const binQueries = useQueries({
    queries: selectedWarehouseIds.map((id) => ({
      queryKey: ['warehouse-bins', id],
      queryFn: () => warehousesService.getBinLocations(id),
      enabled: selectedWarehouseIds.length > 0,
    })),
  });

  // Fetch stock levels for the selected warehouse(s)
  const stockQueries = useQueries({
    queries: selectedWarehouseIds.map((id) => ({
      queryKey: ['stock-levels', id],
      queryFn: () => warehousesService.getStockLevels(id, { limit: 1000 }),
      enabled: selectedWarehouseIds.length > 0,
    })),
  });

  const isLoading = binQueries.some((q) => q.isLoading) || stockQueries.some((q) => q.isLoading);

  // Combine bins with their stock data
  const binsWithStock = useMemo(() => {
    const result: BinWithStock[] = [];
    const warehouseMap = new Map(warehouses?.data?.map((w) => [w.id, w.name]) || []);

    binQueries.forEach((query, index) => {
      if (query.data) {
        const warehouseIdForBins = selectedWarehouseIds[index];
        const stockData = stockQueries[index]?.data?.data || [];

        query.data.forEach((bin) => {
          // Get items in this bin
          const binItems = stockData.filter(
            (stock) => stock.binLocationId === bin.id
          );

          result.push({
            ...bin,
            items: binItems,
            totalQuantity: binItems.reduce((sum, item) => sum + item.onHand, 0),
            itemCount: binItems.length,
          });
        });
      }
    });

    return result;
  }, [binQueries, stockQueries, selectedWarehouseIds, warehouses]);

  // Filter bins by search text (search in item names/codes)
  const filteredBins = useMemo(() => {
    if (!searchText) return binsWithStock;
    const search = searchText.toLowerCase();

    return binsWithStock.filter((bin) => {
      // Search in bin properties
      const binMatch =
        bin.code.toLowerCase().includes(search) ||
        bin.name.toLowerCase().includes(search) ||
        bin.zone?.toLowerCase().includes(search);

      // Search in items within the bin
      const itemMatch = bin.items.some(
        (item) =>
          item.itemCode.toLowerCase().includes(search) ||
          item.itemName.toLowerCase().includes(search)
      );

      return binMatch || itemMatch;
    });
  }, [binsWithStock, searchText]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBins = filteredBins.length;
    const binsWithItems = filteredBins.filter((b) => b.itemCount > 0).length;
    const emptyBins = totalBins - binsWithItems;
    const totalItemsStored = filteredBins.reduce((sum, b) => sum + b.itemCount, 0);
    const totalQuantity = filteredBins.reduce((sum, b) => sum + b.totalQuantity, 0);

    return { totalBins, binsWithItems, emptyBins, totalItemsStored, totalQuantity };
  }, [filteredBins]);

  // Open bin detail if binId is provided in URL
  useEffect(() => {
    if (initialBinId && binsWithStock.length > 0) {
      const bin = binsWithStock.find((b) => b.id === initialBinId);
      if (bin) {
        setSelectedBin(bin);
        setIsModalOpen(true);
      }
    }
  }, [initialBinId, binsWithStock]);

  const handleBinClick = (bin: BinWithStock) => {
    setSelectedBin(bin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBin(null);
    // Remove binId from URL
    if (initialBinId) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('binId');
      router.replace(`/inventory/stock-by-bin?${newParams.toString()}`);
    }
  };

  const handleWarehouseChange = (value: string | undefined) => {
    setWarehouseId(value);
    // Update URL
    const newParams = new URLSearchParams();
    if (value) newParams.set('warehouseId', value);
    router.replace(`/inventory/stock-by-bin?${newParams.toString()}`);
  };

  const getWarehouseName = (wId: string) => {
    return warehouses?.data?.find((w) => w.id === wId)?.name || 'Unknown';
  };

  const columns: ColumnsType<BinWithStock> = [
    {
      title: 'Bin Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      sorter: (a: BinWithStock, b: BinWithStock) => a.code.localeCompare(b.code),
      render: (code: string, record: BinWithStock) => (
        <Button type="link" onClick={() => handleBinClick(record)} className="p-0">
          <span className="font-mono font-medium">{code}</span>
        </Button>
      ),
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
      width: 100,
      render: (zone: string) => zone || '-',
      filters: Array.from(new Set(binsWithStock.map((b) => b.zone).filter(Boolean))).map((z) => ({
        text: z as string,
        value: z as string,
      })),
      onFilter: (value: React.Key | boolean, record: BinWithStock) => record.zone === value,
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (_: unknown, record: BinWithStock) => {
        const parts = [record.aisle, record.rack, record.shelf].filter(Boolean);
        return parts.length > 0 ? (
          <Space size="small">
            <EnvironmentOutlined className="text-gray-400" />
            <span>{parts.join('-')}</span>
          </Space>
        ) : (
          '-'
        );
      },
    },
    {
      title: 'Warehouse',
      key: 'warehouse',
      width: 150,
      render: (_: unknown, record: BinWithStock) => getWarehouseName(record.warehouseId),
      hidden: !!warehouseId,
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center' as const,
      sorter: (a: BinWithStock, b: BinWithStock) => a.itemCount - b.itemCount,
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count}</Tag>
      ),
    },
    {
      title: 'Total Qty',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 120,
      align: 'right' as const,
      sorter: (a: BinWithStock, b: BinWithStock) => a.totalQuantity - b.totalQuantity,
      render: (qty: number) => qty.toLocaleString(),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      align: 'right' as const,
      render: (capacity: number) => (capacity ? capacity.toLocaleString() : '-'),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: BinWithStock) => {
        if (!record.isActive) {
          return <Tag color="default">Inactive</Tag>;
        }
        if (record.itemCount === 0) {
          return <Tag color="orange">Empty</Tag>;
        }
        if (record.capacity && record.totalQuantity >= record.capacity) {
          return <Tag color="red">Full</Tag>;
        }
        return <Tag color="green">In Use</Tag>;
      },
    },
  ].filter((col) => !(col as { hidden?: boolean }).hidden);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock by Bin Location</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total Bins"
              value={stats.totalBins}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Bins with Items"
              value={stats.binsWithItems}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic
              title="Empty Bins"
              value={stats.emptyBins}
              valueStyle={{ color: stats.emptyBins > 0 ? '#faad14' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <Statistic title="Total Quantity Stored" value={stats.totalQuantity} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by Warehouse"
              allowClear
              className="w-full"
              value={warehouseId}
              onChange={handleWarehouseChange}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search bins or items..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          dataSource={filteredBins}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} bins`,
            defaultPageSize: 20,
          }}
          scroll={{ x: 900 }}
          size="middle"
          locale={{
            emptyText: (
              <Empty
                description={
                  warehouseId
                    ? 'No bin locations found in this warehouse'
                    : 'No bin locations found. Select a warehouse or create bin locations first.'
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>

      {/* Bin Detail Modal */}
      <Modal
        title={
          <Space>
            <InboxOutlined />
            <span>Bin: {selectedBin?.code}</span>
            <Tag color={selectedBin?.isActive ? 'green' : 'default'}>
              {selectedBin?.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </Space>
        }
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={700}
      >
        {selectedBin && (
          <div>
            <Row gutter={[16, 8]} className="mb-4">
              <Col span={8}>
                <Text type="secondary">Name:</Text>
                <div>{selectedBin.name}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Zone:</Text>
                <div>{selectedBin.zone || '-'}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Location:</Text>
                <div>
                  {[selectedBin.aisle, selectedBin.rack, selectedBin.shelf]
                    .filter(Boolean)
                    .join('-') || '-'}
                </div>
              </Col>
            </Row>
            <Row gutter={[16, 8]} className="mb-4">
              <Col span={8}>
                <Text type="secondary">Warehouse:</Text>
                <div>{getWarehouseName(selectedBin.warehouseId)}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Capacity:</Text>
                <div>{selectedBin.capacity?.toLocaleString() || 'Unlimited'}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">Total Quantity:</Text>
                <div className="font-medium">{selectedBin.totalQuantity.toLocaleString()}</div>
              </Col>
            </Row>

            <Title level={5} className="mt-4 mb-2">
              Items in this Bin ({selectedBin.itemCount})
            </Title>

            {selectedBin.items.length > 0 ? (
              <List
                size="small"
                bordered
                dataSource={selectedBin.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <span className="font-mono">{item.itemCode}</span>
                          <span>{item.itemName}</span>
                        </Space>
                      }
                    />
                    <Space size="large">
                      <div>
                        <Text type="secondary">On Hand: </Text>
                        <Text strong>{item.onHand}</Text>
                      </div>
                      <div>
                        <Text type="secondary">Available: </Text>
                        <Text
                          strong
                          type={item.available <= 0 ? 'danger' : item.isLowStock ? 'warning' : undefined}
                        >
                          {item.available}
                        </Text>
                      </div>
                    </Space>
                  </List.Item>
                )}
                pagination={
                  selectedBin.items.length > 10
                    ? { pageSize: 10, size: 'small' }
                    : false
                }
              />
            ) : (
              <Empty description="No items in this bin" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

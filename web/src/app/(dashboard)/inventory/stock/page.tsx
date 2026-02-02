'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Select,
  Tag,
  Switch,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
} from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useQuery, useQueries } from '@tanstack/react-query';
import { warehousesService, WarehouseStockLevel } from '@/services/warehouses-service';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

export default function StockLevelsPage() {
  const [warehouseId, setWarehouseId] = useState<string | undefined>();
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  // When a specific warehouse is selected, fetch stock for that warehouse
  const { data: singleWarehouseStock, isLoading: isLoadingSingle } = useQuery({
    queryKey: ['stock-levels', warehouseId, lowStockOnly],
    queryFn: () => warehousesService.getStockLevels(warehouseId!, { lowStockOnly, limit: 1000 }),
    enabled: !!warehouseId,
  });

  // When no warehouse is selected, fetch stock from all warehouses
  const allWarehouseIds = warehouses?.data?.map(w => w.id) || [];
  const allWarehouseQueries = useQueries({
    queries: allWarehouseIds.map(id => ({
      queryKey: ['stock-levels', id, lowStockOnly],
      queryFn: () => warehousesService.getStockLevels(id, { lowStockOnly, limit: 1000 }),
      enabled: !warehouseId && allWarehouseIds.length > 0,
    })),
  });

  const isLoadingAll = allWarehouseQueries.some(q => q.isLoading);
  const isLoading = warehouseId ? isLoadingSingle : isLoadingAll;

  // Combine stock levels from all warehouses or use single warehouse data
  const stockLevels = useMemo(() => {
    if (warehouseId) {
      return singleWarehouseStock?.data || [];
    }
    // Combine results from all warehouse queries
    const combined: WarehouseStockLevel[] = [];
    allWarehouseQueries.forEach((query, index) => {
      if (query.data?.data) {
        const warehouse = warehouses?.data?.[index];
        query.data.data.forEach((item: WarehouseStockLevel) => {
          combined.push({
            ...item,
            warehouseName: warehouse?.name || item.warehouseName,
          });
        });
      }
    });
    return combined;
  }, [warehouseId, singleWarehouseStock, allWarehouseQueries, warehouses]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const totalItems = stockLevels?.length || 0;
  const lowStockItems = stockLevels?.filter((item) => item.isLowStock).length || 0;
  const totalQuantity = stockLevels?.reduce((sum, item) => sum + item.onHand, 0) || 0;

  const columns: ColumnsType<WarehouseStockLevel> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 130,
      render: (code: string, record) => (
        <Space>
          <span className="font-mono">{code}</span>
          {record.isLowStock && <WarningOutlined className="text-orange-500" />}
        </Space>
      ),
      sorter: (a, b) => a.itemCode.localeCompare(b.itemCode),
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
      sorter: (a, b) => a.itemName.localeCompare(b.itemName),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
      filters: warehouses?.data?.map((w) => ({ text: w.name, value: w.name })),
      onFilter: (value, record) => record.warehouseName === value,
    },
    {
      title: 'On Hand',
      dataIndex: 'onHand',
      key: 'onHand',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.onHand - b.onHand,
      render: (qty: number, record) => (
        <span className={record.isLowStock ? 'text-orange-500 font-medium' : ''}>
          {qty}
        </span>
      ),
    },
    {
      title: 'Committed',
      dataIndex: 'committed',
      key: 'committed',
      width: 100,
      align: 'right',
      render: (qty: number) => (qty > 0 ? <span className="text-blue-500">{qty}</span> : '-'),
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.available - b.available,
      render: (qty: number) => (
        <span className={qty <= 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
          {qty}
        </span>
      ),
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorderPoint',
      width: 120,
      align: 'right',
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.available <= 0) {
          return <Tag color="red">Out of Stock</Tag>;
        }
        if (record.isLowStock) {
          return <Tag color="orange">Low Stock</Tag>;
        }
        return <Tag color="green">In Stock</Tag>;
      },
      filters: [
        { text: 'In Stock', value: 'in_stock' },
        { text: 'Low Stock', value: 'low_stock' },
        { text: 'Out of Stock', value: 'out_of_stock' },
      ],
      onFilter: (value, record) => {
        if (value === 'out_of_stock') return record.available <= 0;
        if (value === 'low_stock') return record.isLowStock && record.available > 0;
        return !record.isLowStock && record.available > 0;
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock Levels</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Items" value={totalItems} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={lowStockItems}
              valueStyle={{ color: lowStockItems > 0 ? '#faad14' : undefined }}
              prefix={lowStockItems > 0 ? <WarningOutlined /> : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Total Quantity" value={totalQuantity} />
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
              onChange={(value) => setWarehouseId(value)}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Switch
                checked={lowStockOnly}
                onChange={setLowStockOnly}
              />
              <Text>Show Low Stock Only</Text>
            </Space>
          </Col>
        </Row>

        <Table
          dataSource={stockLevels}
          columns={columns}
          rowKey={(record) => `${record.itemId}-${record.warehouseId}`}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
            defaultPageSize: 20,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

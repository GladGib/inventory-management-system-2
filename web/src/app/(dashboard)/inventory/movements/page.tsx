'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Tag,
  Row,
  Col,
  Typography,
  Button,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { inventoryService, StockMovement, StockMovementsParams } from '@/services/inventory-service';
import { warehousesService } from '@/services/warehouses-service';
import { itemsService } from '@/services/items-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const movementTypeColors: Record<string, string> = {
  PURCHASE_IN: 'green',
  SALES_OUT: 'red',
  TRANSFER_IN: 'blue',
  TRANSFER_OUT: 'orange',
  ADJUSTMENT_ADD: 'cyan',
  ADJUSTMENT_SUBTRACT: 'magenta',
  RETURN_IN: 'lime',
  RETURN_OUT: 'volcano',
};

const movementTypeLabels: Record<string, string> = {
  PURCHASE_IN: 'Purchase In',
  SALES_OUT: 'Sales Out',
  TRANSFER_IN: 'Transfer In',
  TRANSFER_OUT: 'Transfer Out',
  ADJUSTMENT_ADD: 'Adjustment (+)',
  ADJUSTMENT_SUBTRACT: 'Adjustment (-)',
  RETURN_IN: 'Return In',
  RETURN_OUT: 'Return Out',
};

export default function StockMovementsPage() {
  const [params, setParams] = useState<StockMovementsParams>({
    page: 1,
    limit: 20,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const { data: items } = useQuery({
    queryKey: ['items-list'],
    queryFn: () => itemsService.getItems({ limit: 500 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => inventoryService.getStockMovements(params),
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, page: 1 }));
  };

  const columns: ColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Item',
      key: 'item',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-mono text-xs text-gray-500">{record.itemCode}</div>
          <div className="truncate">{record.itemName}</div>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 130,
      ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      width: 140,
      render: (type: string) => (
        <Tag color={movementTypeColors[type] || 'default'}>
          {movementTypeLabels[type] || type}
        </Tag>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (qty: number, record) => {
        const isPositive = record.movementType.includes('IN') || record.movementType.includes('ADD');
        return (
          <span className={isPositive ? 'text-green-600' : 'text-red-500'}>
            {isPositive ? '+' : '-'}{Math.abs(qty)}
          </span>
        );
      },
    },
    {
      title: 'Before',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 80,
      align: 'right',
    },
    {
      title: 'After',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 80,
      align: 'right',
    },
    {
      title: 'Reference',
      key: 'reference',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-xs text-gray-500">{record.referenceType}</div>
          <div className="font-mono text-xs">{record.referenceNumber}</div>
        </div>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => notes || '-',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock Movements</Title>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Item"
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, itemId: value, page: 1 }))}
              options={items?.data?.map((item) => ({
                value: item.id,
                label: `${item.code} - ${item.name}`,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Warehouse"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, warehouseId: value, page: 1 }))}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Type"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, movementType: value, page: 1 }))}
              options={Object.entries(movementTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              className="w-full"
              onChange={(dates) => {
                setParams((prev) => ({
                  ...prev,
                  fromDate: dates?.[0]?.format('YYYY-MM-DD'),
                  toDate: dates?.[1]?.format('YYYY-MM-DD'),
                  page: 1,
                }));
              }}
            />
          </Col>
        </Row>

        <Table
          dataSource={data?.data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: params.page,
            pageSize: params.limit,
            total: data?.meta?.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} movements`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
}

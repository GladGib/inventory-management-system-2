'use client';

import { useState } from 'react';
import { Table, Tag, Switch, InputNumber, Button, Space, App } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// Usage:
// <VariantList variants={variants} onUpdate={handleUpdate} onToggleActive={handleToggleActive} loading={false} />

export interface Variant {
  id: string;
  code: string;
  name: string;
  attributes: Record<string, string>; // e.g., { "Size": "M", "Color": "Red" }
  costPrice: number;
  sellingPrice: number;
  stockOnHand?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface VariantListProps {
  variants: Variant[];
  onUpdate: (variantId: string, data: { costPrice?: number; sellingPrice?: number }) => void;
  onToggleActive: (variantId: string, isActive: boolean) => void;
  loading?: boolean;
}

interface EditingState {
  variantId: string;
  costPrice: number;
  sellingPrice: number;
}

export function VariantList({ variants, onUpdate, onToggleActive, loading }: VariantListProps) {
  const { message } = App.useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingState | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(value);
  };

  const handleEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditingData({
      variantId: variant.id,
      costPrice: variant.costPrice,
      sellingPrice: variant.sellingPrice,
    });
  };

  const handleSave = () => {
    if (!editingData) return;

    if (editingData.sellingPrice <= 0) {
      message.error('Selling price must be greater than 0');
      return;
    }

    if (editingData.costPrice < 0) {
      message.error('Cost price cannot be negative');
      return;
    }

    onUpdate(editingData.variantId, {
      costPrice: editingData.costPrice,
      sellingPrice: editingData.sellingPrice,
    });

    setEditingId(null);
    setEditingData(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const columns: ColumnsType<Variant> = [
    {
      title: 'Code/SKU',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      fixed: 'left',
      render: (code: string) => (
        <span className="font-mono text-sm text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
          {code}
        </span>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium text-gray-900">{name}</span>
      ),
    },
    {
      title: 'Attributes',
      dataIndex: 'attributes',
      key: 'attributes',
      width: 250,
      render: (attributes: Record<string, string>) => (
        <div className="flex flex-wrap gap-1">
          {Object.entries(attributes).map(([key, value]) => (
            <Tag key={key} className="!bg-blue-50 !text-blue-700 !border-blue-200 !text-xs">
              <span className="font-medium">{key}:</span> {value}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 150,
      align: 'right',
      render: (price: number, record) => {
        if (editingId === record.id) {
          return (
            <InputNumber
              size="small"
              min={0}
              precision={2}
              value={editingData?.costPrice}
              onChange={(value) =>
                setEditingData((prev) =>
                  prev ? { ...prev, costPrice: value || 0 } : null
                )
              }
              prefix="RM"
              className="w-full"
            />
          );
        }
        return <span className="text-gray-600">{formatCurrency(price)}</span>;
      },
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 150,
      align: 'right',
      render: (price: number, record) => {
        if (editingId === record.id) {
          return (
            <InputNumber
              size="small"
              min={0}
              precision={2}
              value={editingData?.sellingPrice}
              onChange={(value) =>
                setEditingData((prev) =>
                  prev ? { ...prev, sellingPrice: value || 0 } : null
                )
              }
              prefix="RM"
              className="w-full"
            />
          );
        }
        return <span className="font-medium text-gray-900">{formatCurrency(price)}</span>;
      },
    },
    {
      title: 'Stock On Hand',
      dataIndex: 'stockOnHand',
      key: 'stockOnHand',
      width: 130,
      align: 'right',
      render: (stock?: number) => (
        <span className={`font-medium ${stock === 0 ? 'text-red-500' : stock && stock < 10 ? 'text-orange-500' : 'text-gray-900'}`}>
          {stock ?? 0}
        </span>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      align: 'center',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => onToggleActive(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_, record) => {
        if (editingId === record.id) {
          return (
            <Space size="small">
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Space>
          );
        }
        return (
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={variants}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        pageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showTotal: (total, range) => (
          <span className="text-gray-500">
            Showing {range[0]}-{range[1]} of {total} variants
          </span>
        ),
      }}
      scroll={{ x: 1200 }}
      size="middle"
      className="variants-table"
    />
  );
}

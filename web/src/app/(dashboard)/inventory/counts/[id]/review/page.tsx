'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Typography,
  Descriptions,
  App,
  Modal,
  Alert,
  Statistic,
  Checkbox,
  Input,
  Divider,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  stockCountsService,
  StockCount,
  StockCountLine,
} from '@/services/stock-counts-service';
import {
  inventoryService,
  CreateStockAdjustmentRequest,
} from '@/services/inventory-service';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

interface VarianceLine extends StockCountLine {
  selected: boolean;
  flaggedForRecount: boolean;
}

export default function StockCountReviewPage() {
  const router = useRouter();
  const params = useParams();
  const countId = params.id as string;
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [varianceLines, setVarianceLines] = useState<VarianceLine[]>([]);
  const [searchText, setSearchText] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: stockCount, isLoading } = useQuery({
    queryKey: ['stock-count', countId],
    queryFn: () => stockCountsService.getStockCount(countId),
    enabled: !!countId,
  });

  // Initialize variance lines when data loads
  useMemo(() => {
    if (stockCount?.lines && !initialized) {
      const linesWithVariance = stockCount.lines
        .filter((line) => line.variance !== null && line.variance !== 0)
        .map((line) => ({
          ...line,
          selected: true,
          flaggedForRecount: false,
        }));
      setVarianceLines(linesWithVariance);
      setInitialized(true);
    }
  }, [stockCount, initialized]);

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: CreateStockAdjustmentRequest) =>
      inventoryService.createStockAdjustment(data),
    onSuccess: () => {
      message.success('Stock adjustment created successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-count', countId] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      router.push('/inventory/adjustments');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.error?.message || 'Failed to create adjustment'
      );
    },
  });

  const handleSelectLine = (lineId: string, selected: boolean) => {
    setVarianceLines((prev) =>
      prev.map((line) =>
        line.id === lineId ? { ...line, selected } : line
      )
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setVarianceLines((prev) =>
      prev.map((line) => ({
        ...line,
        selected: line.flaggedForRecount ? false : selected,
      }))
    );
  };

  const handleFlagForRecount = (lineId: string, flagged: boolean) => {
    setVarianceLines((prev) =>
      prev.map((line) =>
        line.id === lineId
          ? { ...line, flaggedForRecount: flagged, selected: flagged ? false : line.selected }
          : line
      )
    );
  };

  const handleApproveVariances = () => {
    const selectedLines = varianceLines.filter((l) => l.selected && !l.flaggedForRecount);

    if (selectedLines.length === 0) {
      message.warning('No items selected for adjustment');
      return;
    }

    modal.confirm({
      title: 'Approve Variances',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>
            Are you sure you want to create a stock adjustment for{' '}
            <strong>{selectedLines.length}</strong> items?
          </p>
          <Alert
            type="info"
            message="This will update inventory levels to match the counted quantities"
            className="mt-3"
          />
        </div>
      ),
      okText: 'Create Adjustment',
      cancelText: 'Cancel',
      onOk: () => {
        if (!stockCount) return;

        // Split into additions and subtractions
        const additions = selectedLines.filter((l) => (l.variance || 0) > 0);
        const subtractions = selectedLines.filter((l) => (l.variance || 0) < 0);

        // Create adjustment for additions if any
        if (additions.length > 0) {
          const addAdjustment: CreateStockAdjustmentRequest = {
            warehouseId: stockCount.warehouseId,
            adjustmentType: 'CORRECTION',
            reason: `Stock count adjustment (additions) - ${stockCount.countNumber}`,
            lines: additions.map((line) => ({
              itemId: line.itemId,
              quantity: Math.abs(line.variance || 0),
            })),
          };
          createAdjustmentMutation.mutate(addAdjustment);
        }

        // For subtractions, we would need to handle separately
        // For now, we'll combine them in one adjustment request
        // The backend should handle the logic based on adjustment type
        if (subtractions.length > 0 && additions.length === 0) {
          const subAdjustment: CreateStockAdjustmentRequest = {
            warehouseId: stockCount.warehouseId,
            adjustmentType: 'CORRECTION',
            reason: `Stock count adjustment (reductions) - ${stockCount.countNumber}`,
            lines: subtractions.map((line) => ({
              itemId: line.itemId,
              quantity: Math.abs(line.variance || 0),
            })),
          };
          createAdjustmentMutation.mutate(subAdjustment);
        }
      },
    });
  };

  // Filter lines based on search
  const filteredLines = useMemo(() => {
    if (!searchText) return varianceLines;
    const searchLower = searchText.toLowerCase();
    return varianceLines.filter(
      (line) =>
        line.itemCode.toLowerCase().includes(searchLower) ||
        line.itemName.toLowerCase().includes(searchLower)
    );
  }, [varianceLines, searchText]);

  // Calculate statistics
  const selectedCount = varianceLines.filter((l) => l.selected).length;
  const recountCount = varianceLines.filter((l) => l.flaggedForRecount).length;
  const totalPositiveVariance = varianceLines
    .filter((l) => l.selected && (l.variance || 0) > 0)
    .reduce((sum, l) => sum + (l.variance || 0), 0);
  const totalNegativeVariance = varianceLines
    .filter((l) => l.selected && (l.variance || 0) < 0)
    .reduce((sum, l) => sum + Math.abs(l.variance || 0), 0);

  const columns: ColumnsType<VarianceLine> = [
    {
      title: (
        <Checkbox
          checked={
            varianceLines.length > 0 &&
            varianceLines.filter((l) => !l.flaggedForRecount).every((l) => l.selected)
          }
          indeterminate={
            varianceLines.some((l) => l.selected && !l.flaggedForRecount) &&
            !varianceLines.filter((l) => !l.flaggedForRecount).every((l) => l.selected)
          }
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={record.selected}
          disabled={record.flaggedForRecount}
          onChange={(e) => handleSelectLine(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 130,
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
    },
    {
      title: 'System Qty',
      dataIndex: 'systemQty',
      key: 'systemQty',
      width: 100,
      align: 'center',
      render: (qty: number) => <Text>{qty}</Text>,
    },
    {
      title: 'Counted Qty',
      dataIndex: 'countedQty',
      key: 'countedQty',
      width: 100,
      align: 'center',
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: 'Variance',
      dataIndex: 'variance',
      key: 'variance',
      width: 120,
      align: 'center',
      sorter: (a, b) => (a.variance || 0) - (b.variance || 0),
      render: (variance: number) => {
        if (variance === 0) {
          return <Tag>0</Tag>;
        }
        const isPositive = variance > 0;
        return (
          <Tag
            color={isPositive ? 'success' : 'error'}
            icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          >
            {isPositive ? '+' : ''}
            {variance}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.flaggedForRecount) {
          return <Tag color="warning" icon={<ReloadOutlined />}>Recount</Tag>;
        }
        if (record.selected) {
          return <Tag color="blue" icon={<CheckCircleOutlined />}>To Adjust</Tag>;
        }
        return <Tag color="default">Excluded</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button
            type={record.flaggedForRecount ? 'primary' : 'default'}
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleFlagForRecount(record.id, !record.flaggedForRecount)}
          >
            {record.flaggedForRecount ? 'Unflag' : 'Recount'}
          </Button>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Card loading />
      </div>
    );
  }

  if (!stockCount) {
    return (
      <div className="p-6">
        <Alert type="error" message="Stock count not found" />
      </div>
    );
  }

  const hasVariances = varianceLines.length > 0;

  return (
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(`/inventory/counts/${countId}`)}
            />
            <span>Variance Review: {stockCount.countNumber}</span>
          </Space>
        }
        extra={
          hasVariances && (
            <Space>
              <Button
                onClick={() => router.push(`/inventory/counts/${countId}`)}
              >
                Back to Count
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApproveVariances}
                loading={createAdjustmentMutation.isPending}
                disabled={selectedCount === 0}
              >
                Approve Selected ({selectedCount})
              </Button>
            </Space>
          )
        }
      />

      <Row gutter={24}>
        <Col xs={24} lg={18}>
          <Card className="mb-6">
            {!hasVariances ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No variances found in this stock count"
              >
                <Button
                  type="primary"
                  onClick={() => router.push(`/inventory/counts/${countId}`)}
                >
                  Back to Count
                </Button>
              </Empty>
            ) : (
              <>
                <Alert
                  type="info"
                  message="Review Variance Items"
                  description={
                    <div>
                      <p>Review items with variances between system and counted quantities.</p>
                      <ul className="mt-2 list-disc list-inside">
                        <li>Select items to include in the stock adjustment</li>
                        <li>Flag items for recount if you need to verify them again</li>
                        <li>Click "Approve Selected" to create a stock adjustment</li>
                      </ul>
                    </div>
                  }
                  className="mb-4"
                  showIcon
                />

                <div className="mb-4">
                  <Input
                    placeholder="Search by item code or name..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 280 }}
                    allowClear
                  />
                </div>

                <Table
                  dataSource={filteredLines}
                  columns={columns}
                  rowKey="id"
                  pagination={{
                    pageSize: 15,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} items with variances`,
                  }}
                  size="middle"
                  scroll={{ x: 900 }}
                  rowClassName={(record) =>
                    record.flaggedForRecount
                      ? 'bg-orange-50'
                      : record.selected
                      ? 'bg-blue-50'
                      : 'bg-gray-50'
                  }
                />
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Count Details" className="mb-4">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Count Number">
                <Text strong className="font-mono">
                  {stockCount.countNumber}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Warehouse">
                {stockCount.warehouseName}
              </Descriptions.Item>
              <Descriptions.Item label="Count Date">
                {dayjs(stockCount.countDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[stockCount.status]}>
                  {statusLabels[stockCount.status]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Variance Summary" className="mb-4">
            <div className="space-y-4">
              <Statistic
                title="Total Variance Items"
                value={varianceLines.length}
                prefix={<WarningOutlined className="text-yellow-500" />}
              />

              <Divider className="my-3" />

              <Statistic
                title="Selected for Adjustment"
                value={selectedCount}
                valueStyle={{ color: '#1890ff' }}
              />

              <Statistic
                title="Flagged for Recount"
                value={recountCount}
                valueStyle={{ color: '#faad14' }}
              />

              <Divider className="my-3" />

              <div className="flex justify-between items-center">
                <Text type="secondary">
                  <ArrowUpOutlined className="text-green-500" /> Over Count:
                </Text>
                <Text strong className="text-green-600">
                  +{totalPositiveVariance}
                </Text>
              </div>

              <div className="flex justify-between items-center">
                <Text type="secondary">
                  <ArrowDownOutlined className="text-red-500" /> Under Count:
                </Text>
                <Text strong className="text-red-600">
                  -{totalNegativeVariance}
                </Text>
              </div>
            </div>
          </Card>

          {recountCount > 0 && (
            <Alert
              type="warning"
              message={`${recountCount} items flagged for recount`}
              description="These items will be excluded from the adjustment and should be recounted."
              showIcon
              className="mb-4"
            />
          )}

          {stockCount.status === 'COMPLETED' && (
            <Alert
              type="info"
              message="Count Completed"
              description="This stock count has been completed. You can review the variances but cannot create new adjustments."
              showIcon
            />
          )}
        </Col>
      </Row>
    </div>
  );
}

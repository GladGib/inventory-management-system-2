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
  InputNumber,
  App,
  Modal,
  Alert,
  Statistic,
  Progress,
  Divider,
  Input,
  Radio,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  FileSearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import {
  stockCountsService,
  StockCount,
  StockCountLine,
  RecordCountRequest,
} from '@/services/stock-counts-service';

const { Title, Text } = Typography;

const statusColors: Record<string, string> = {
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
};

const statusLabels: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

type FilterType = 'all' | 'pending' | 'counted' | 'variance';

export default function StockCountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const countId = params.id as string;
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [countEntries, setCountEntries] = useState<Record<string, number | null>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const { data: stockCount, isLoading } = useQuery({
    queryKey: ['stock-count', countId],
    queryFn: () => stockCountsService.getStockCount(countId),
    enabled: !!countId,
  });

  const saveMutation = useMutation({
    mutationFn: (entries: RecordCountRequest[]) =>
      stockCountsService.recordCount(countId, entries),
    onSuccess: () => {
      message.success('Count entries saved');
      queryClient.invalidateQueries({ queryKey: ['stock-count', countId] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to save entries');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (createAdjustment: boolean) =>
      stockCountsService.completeStockCount(countId, createAdjustment),
    onSuccess: () => {
      message.success('Stock count completed');
      queryClient.invalidateQueries({ queryKey: ['stock-count', countId] });
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to complete count');
    },
  });

  const handleCountChange = (lineId: string, value: number | null) => {
    setCountEntries((prev) => ({
      ...prev,
      [lineId]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const entries: RecordCountRequest[] = Object.entries(countEntries)
      .filter(([_, qty]) => qty !== null && qty !== undefined)
      .map(([lineId, countedQty]) => ({
        lineId,
        countedQty: countedQty!,
      }));

    if (entries.length === 0) {
      message.warning('No entries to save');
      return;
    }

    saveMutation.mutate(entries);
  };

  const handleComplete = () => {
    const uncountedLines = stockCount?.lines.filter(
      (l) => l.countedQty === null && countEntries[l.id] === undefined
    );

    if (uncountedLines && uncountedLines.length > 0) {
      message.error(`${uncountedLines.length} items have not been counted yet`);
      return;
    }

    // Save any pending entries first
    if (hasChanges) {
      message.warning('Please save your entries before completing the count');
      return;
    }

    const varianceCount = stockCount?.lines.filter(
      (l) => l.variance !== null && l.variance !== 0
    ).length || 0;

    modal.confirm({
      title: 'Complete Stock Count',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>Are you sure you want to complete this stock count?</p>
          {varianceCount > 0 && (
            <Alert
              type="warning"
              message={`${varianceCount} items have variances`}
              description="A stock adjustment will be created to reconcile the differences."
              className="mt-3"
            />
          )}
        </div>
      ),
      okText: 'Complete & Create Adjustment',
      cancelText: 'Cancel',
      onOk: () => completeMutation.mutate(true),
    });
  };

  const getDisplayedValue = (line: StockCountLine) => {
    if (countEntries[line.id] !== undefined) {
      return countEntries[line.id];
    }
    return line.countedQty;
  };

  const getVariance = (line: StockCountLine) => {
    const counted = getDisplayedValue(line);
    if (counted === null || counted === undefined) return null;
    return counted - line.systemQty;
  };

  const totalItems = stockCount?.lines.length || 0;
  const countedItems = stockCount?.lines.filter(
    (l) => l.countedQty !== null || countEntries[l.id] !== undefined
  ).length || 0;
  const varianceItems = stockCount?.lines.filter(
    (l) => l.variance !== null && l.variance !== 0
  ).length || 0;

  // Calculate current variance items including unsaved entries
  const currentVarianceItems = useMemo(() => {
    return stockCount?.lines.filter((l) => {
      const variance = stockCount.status === 'COMPLETED' ? l.variance : getVariance(l);
      return variance !== null && variance !== 0;
    }).length || 0;
  }, [stockCount, countEntries]);

  // Filter lines based on search and filter type
  const filteredLines = useMemo(() => {
    if (!stockCount?.lines) return [];

    return stockCount.lines.filter((line) => {
      // Search filter
      const searchLower = searchText.toLowerCase();
      const matchesSearch = !searchText ||
        line.itemCode.toLowerCase().includes(searchLower) ||
        line.itemName.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Type filter
      const counted = getDisplayedValue(line);
      const variance = stockCount.status === 'COMPLETED' ? line.variance : getVariance(line);

      switch (filterType) {
        case 'pending':
          return counted === null || counted === undefined;
        case 'counted':
          return counted !== null && counted !== undefined;
        case 'variance':
          return variance !== null && variance !== 0;
        default:
          return true;
      }
    });
  }, [stockCount, searchText, filterType, countEntries]);

  const columns: ColumnsType<StockCountLine> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 130,
      fixed: 'left',
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
      width: 110,
      align: 'center',
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: 'Counted Qty',
      key: 'countedQty',
      width: 130,
      align: 'center',
      render: (_, record) => {
        if (stockCount?.status === 'COMPLETED') {
          return <Text>{record.countedQty}</Text>;
        }
        return (
          <InputNumber
            min={0}
            value={getDisplayedValue(record) ?? undefined}
            onChange={(value) => handleCountChange(record.id, value)}
            placeholder="Enter"
            className="w-full"
          />
        );
      },
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const variance = stockCount?.status === 'COMPLETED' ? record.variance : getVariance(record);
        if (variance === null || variance === undefined) {
          return <Text type="secondary">-</Text>;
        }
        const color = variance === 0 ? 'default' : variance > 0 ? 'success' : 'error';
        return (
          <Tag color={color}>
            {variance > 0 ? '+' : ''}{variance}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const counted = getDisplayedValue(record);
        if (counted !== null && counted !== undefined) {
          return <CheckCircleOutlined className="text-green-500 text-lg" />;
        }
        return <Tag color="warning">Pending</Tag>;
      },
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

  return (
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/inventory/counts')}
            />
            <span>Stock Count: {stockCount.countNumber}</span>
          </Space>
        }
        extra={
          <Space>
            {stockCount.status === 'IN_PROGRESS' && (
              <>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saveMutation.isPending}
                  disabled={!hasChanges}
                >
                  Save Entries
                </Button>
                {currentVarianceItems > 0 && (
                  <Tooltip title="Review items with variances">
                    <Button
                      icon={<FileSearchOutlined />}
                      onClick={() => router.push(`/inventory/counts/${countId}/review`)}
                    >
                      Review Variances ({currentVarianceItems})
                    </Button>
                  </Tooltip>
                )}
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleComplete}
                  loading={completeMutation.isPending}
                >
                  Complete Count
                </Button>
              </>
            )}
            {stockCount.status === 'COMPLETED' && varianceItems > 0 && (
              <Button
                icon={<FileSearchOutlined />}
                onClick={() => router.push(`/inventory/counts/${countId}/review`)}
              >
                View Variance Report
              </Button>
            )}
          </Space>
        }
      />

      <Row gutter={24}>
        <Col xs={24} lg={18}>
          <Card title="Count Items" className="mb-6">
            {stockCount.status === 'IN_PROGRESS' && (
              <Alert
                type="info"
                message="Enter the actual counted quantities for each item"
                description="Items with variances will trigger a stock adjustment when the count is completed."
                className="mb-4"
                showIcon
              />
            )}

            {/* Search and Filter Controls */}
            <div className="flex flex-wrap gap-4 mb-4">
              <Input
                placeholder="Search by item code or name..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
              <Radio.Group
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="all">
                  All ({totalItems})
                </Radio.Button>
                <Radio.Button value="pending">
                  Pending ({totalItems - countedItems})
                </Radio.Button>
                <Radio.Button value="counted">
                  Counted ({countedItems})
                </Radio.Button>
                <Radio.Button value="variance">
                  <WarningOutlined /> Variance ({currentVarianceItems})
                </Radio.Button>
              </Radio.Group>
            </div>

            <Table
              dataSource={filteredLines}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              size="middle"
              scroll={{ x: 700 }}
              rowClassName={(record) => {
                const variance = stockCount.status === 'COMPLETED' ? record.variance : getVariance(record);
                if (variance !== null && variance !== 0) {
                  return 'bg-yellow-50';
                }
                return '';
              }}
              locale={{
                emptyText: filterType !== 'all'
                  ? `No items match the "${filterType}" filter`
                  : 'No items to count',
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title="Count Details" className="mb-4">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Count Number">
                <Text strong className="font-mono">{stockCount.countNumber}</Text>
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
              {stockCount.notes && (
                <Descriptions.Item label="Notes">
                  {stockCount.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Progress" className="mb-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Text type="secondary">Items Counted</Text>
                  <Text>{countedItems}/{totalItems}</Text>
                </div>
                <Progress
                  percent={Math.round((countedItems / totalItems) * 100)}
                  status={countedItems === totalItems ? 'success' : 'active'}
                  showInfo={false}
                />
              </div>

              <Divider className="my-3" />

              <Statistic
                title="Total Items"
                value={totalItems}
              />
              <Statistic
                title="Counted"
                value={countedItems}
                valueStyle={{ color: countedItems === totalItems ? '#52c41a' : '#1890ff' }}
              />
              {varianceItems > 0 && (
                <Statistic
                  title="With Variances"
                  value={varianceItems}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              )}
            </div>
          </Card>

          {stockCount.status === 'COMPLETED' && varianceItems > 0 && (
            <Alert
              type="success"
              message="Count Completed"
              description="A stock adjustment has been created to reconcile the variances."
              showIcon
            />
          )}
        </Col>
      </Row>
    </div>
  );
}

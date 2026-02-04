'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Select,
  Tag,
  App,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  Input,
  Space,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  stockCountsService,
  StockCount,
  StockCountStatus,
  CreateStockCountRequest,
} from '@/services/stock-counts-service';
import { warehousesService } from '@/services/warehouses-service';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors: Record<StockCountStatus, string> = {
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
};

const statusLabels: Record<StockCountStatus, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

export default function StockCountsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const [params, setParams] = useState<{
    page: number;
    limit: number;
    warehouseId?: string;
    status?: StockCountStatus;
  }>({
    page: 1,
    limit: 20,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['stock-counts', params],
    queryFn: () => stockCountsService.getStockCounts(params),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getWarehouses({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStockCountRequest) => stockCountsService.createStockCount(data),
    onSuccess: (result) => {
      message.success('Stock count created successfully');
      queryClient.invalidateQueries({ queryKey: ['stock-counts'] });
      handleCloseModal();
      router.push(`/inventory/counts/${result.id}`);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create stock count');
    },
  });

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = (values: any) => {
    const countData: CreateStockCountRequest = {
      warehouseId: values.warehouseId,
      notes: values.notes,
    };

    createMutation.mutate(countData);
  };

  const inProgressCount = data?.data?.filter((c) => c.status === 'IN_PROGRESS').length || 0;
  const completedCount = data?.data?.filter((c) => c.status === 'COMPLETED').length || 0;

  const columns: ColumnsType<StockCount> = [
    {
      title: 'Count #',
      dataIndex: 'countNumber',
      key: 'countNumber',
      width: 140,
      render: (num: string) => <span className="font-mono">{num}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'countDate',
      key: 'countDate',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: StockCountStatus) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'lines',
      key: 'lineCount',
      width: 80,
      align: 'center',
      render: (lines: StockCount['lines']) => lines?.length || 0,
    },
    {
      title: 'Counted',
      dataIndex: 'lines',
      key: 'countedItems',
      width: 100,
      align: 'center',
      render: (lines: StockCount['lines']) => {
        const counted = lines?.filter((l) => l.countedQty !== null).length || 0;
        const total = lines?.length || 0;
        return (
          <span className={counted === total ? 'text-green-600' : 'text-orange-500'}>
            {counted}/{total}
          </span>
        );
      },
    },
    {
      title: 'Variances',
      dataIndex: 'lines',
      key: 'variances',
      width: 100,
      align: 'center',
      render: (lines: StockCount['lines']) => {
        const variances = lines?.filter((l) => l.variance !== null && l.variance !== 0).length || 0;
        return variances > 0 ? (
          <Tag color="warning">{variances}</Tag>
        ) : (
          <Tag color="default">0</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/inventory/counts/${record.id}`)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Stock Counts</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/inventory/counts/new')}>
          New Count
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="In Progress"
              value={inProgressCount}
              prefix={<ClockCircleOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Completed"
              value={completedCount}
              prefix={<CheckCircleOutlined className="text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Counts"
              value={data?.meta?.total || 0}
              prefix={<BarChartOutlined className="text-gray-500" />}
            />
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
              onChange={(value) => setParams((prev) => ({ ...prev, warehouseId: value, page: 1 }))}
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: w.name,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by Status"
              allowClear
              className="w-full"
              onChange={(value) => setParams((prev) => ({ ...prev, status: value, page: 1 }))}
              options={Object.entries(statusLabels).map(([value, label]) => ({
                value,
                label,
              }))}
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
            showTotal: (total) => `Total ${total} counts`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>

      {/* New Count Modal */}
      <Modal
        title="Start New Stock Count"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="warehouseId"
            label="Warehouse"
            rules={[{ required: true, message: 'Please select warehouse' }]}
          >
            <Select
              placeholder="Select warehouse to count"
              options={warehouses?.data?.map((w) => ({
                value: w.id,
                label: `${w.code} - ${w.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes for this count" />
          </Form.Item>

          <Text type="secondary" className="block mb-4">
            A new stock count will be created with all items currently in stock at the selected warehouse.
            You can then enter the counted quantities for each item.
          </Text>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
              >
                Start Count
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Dropdown,
  App,
  Row,
  Col,
  Typography,
  Breadcrumb,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  StopOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  warehousesService,
  BinLocation,
  CreateBinLocationRequest,
} from '@/services/warehouses-service';
import { BinModal } from '@/components/warehouses/bin-modal';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function WarehouseBinsPage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = params.id as string;
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<BinLocation | null>(null);

  // Fetch warehouse details
  const { data: warehouse, isLoading: warehouseLoading } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: () => warehousesService.getWarehouse(warehouseId),
    enabled: !!warehouseId,
  });

  // Fetch bin locations
  const { data: binLocations, isLoading: binsLoading } = useQuery({
    queryKey: ['warehouse-bins', warehouseId],
    queryFn: () => warehousesService.getBinLocations(warehouseId),
    enabled: !!warehouseId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBinLocationRequest) =>
      warehousesService.createBinLocation(warehouseId, data),
    onSuccess: () => {
      message.success('Bin location created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', warehouseId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create bin location');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ binId, data }: { binId: string; data: Partial<CreateBinLocationRequest> }) =>
      warehousesService.updateBinLocation(warehouseId, binId, data),
    onSuccess: () => {
      message.success('Bin location updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', warehouseId] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update bin location');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (binId: string) => warehousesService.deactivateBinLocation(warehouseId, binId),
    onSuccess: () => {
      message.success('Bin location deactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', warehouseId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to deactivate bin location. Make sure the bin has zero stock.');
    },
  });

  const handleOpenModal = (bin?: BinLocation) => {
    setEditingBin(bin || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBin(null);
  };

  const handleSubmit = (values: CreateBinLocationRequest) => {
    if (editingBin) {
      updateMutation.mutate({ binId: editingBin.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDeactivate = (bin: BinLocation) => {
    modal.confirm({
      title: 'Deactivate Bin Location',
      content: (
        <div>
          <p>Are you sure you want to deactivate bin location "{bin.code}"?</p>
          <p className="text-orange-500 mt-2">
            Note: This action will fail if the bin contains any stock. Please transfer or adjust stock to zero first.
          </p>
        </div>
      ),
      okText: 'Deactivate',
      okButtonProps: { danger: true },
      onOk: () => deactivateMutation.mutate(bin.id),
    });
  };

  const handleViewStock = (bin: BinLocation) => {
    router.push(`/inventory/stock-by-bin?binId=${bin.id}&warehouseId=${warehouseId}`);
  };

  const getActionItems = (record: BinLocation): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Stock',
      onClick: () => handleViewStock(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleOpenModal(record),
    },
    { type: 'divider' },
    {
      key: 'deactivate',
      icon: <StopOutlined />,
      label: 'Deactivate',
      danger: true,
      disabled: !record.isActive,
      onClick: () => handleDeactivate(record),
    },
  ];

  // Filter bins by search text
  const filteredBins = binLocations?.filter((bin) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      bin.code.toLowerCase().includes(search) ||
      bin.name.toLowerCase().includes(search) ||
      bin.zone?.toLowerCase().includes(search) ||
      bin.aisle?.toLowerCase().includes(search) ||
      bin.rack?.toLowerCase().includes(search) ||
      bin.shelf?.toLowerCase().includes(search)
    );
  });

  const columns: ColumnsType<BinLocation> = [
    {
      title: 'Bin Code',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      sorter: (a, b) => a.code.localeCompare(b.code),
      render: (code: string) => <span className="font-mono font-medium">{code}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
      width: 100,
      render: (zone: string) => zone || '-',
      filters: Array.from(new Set(binLocations?.map((b) => b.zone).filter(Boolean) || [])).map((z) => ({
        text: z as string,
        value: z as string,
      })),
      onFilter: (value, record) => record.zone === value,
    },
    {
      title: 'Aisle',
      dataIndex: 'aisle',
      key: 'aisle',
      width: 80,
      render: (aisle: string) => aisle || '-',
    },
    {
      title: 'Rack',
      dataIndex: 'rack',
      key: 'rack',
      width: 80,
      render: (rack: string) => rack || '-',
    },
    {
      title: 'Shelf',
      dataIndex: 'shelf',
      key: 'shelf',
      width: 80,
      render: (shelf: string) => shelf || '-',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      align: 'right',
      render: (capacity: number) => (capacity ? capacity.toLocaleString() : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumb
        className="mb-4"
        items={[
          { title: <Link href="/warehouses">Warehouses</Link> },
          { title: warehouse?.name || 'Loading...' },
          { title: 'Bin Locations' },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/warehouses')}
          >
            Back
          </Button>
          <Title level={4} className="mb-0">
            Bin Locations - {warehouse?.name || '...'}
          </Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Create Bin
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={16} md={12}>
            <Input
              placeholder="Search by code, name, zone, aisle..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Text type="secondary">
              Total: {filteredBins?.length || 0} bin locations
            </Text>
          </Col>
        </Row>

        <Table
          dataSource={filteredBins}
          columns={columns}
          rowKey="id"
          loading={binsLoading || warehouseLoading}
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
                description="No bin locations found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => handleOpenModal()}>
                  Create First Bin
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      <BinModal
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
        editingBin={editingBin}
      />
    </div>
  );
}

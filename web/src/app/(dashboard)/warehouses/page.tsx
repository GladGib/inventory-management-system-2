'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Dropdown,
  Modal,
  Form,
  Switch,
  App,
  Row,
  Col,
  Typography,
  Descriptions,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  warehousesService,
  Warehouse,
  BinLocation,
  CreateWarehouseRequest,
  CreateBinLocationRequest,
  WarehousesListParams,
} from '@/services/warehouses-service';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;

export default function WarehousesPage() {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [binForm] = Form.useForm();

  const [params, setParams] = useState<WarehousesListParams>({ page: 1, limit: 20 });
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  const [editingBin, setEditingBin] = useState<BinLocation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', params],
    queryFn: () => warehousesService.getWarehouses(params),
  });

  const { data: binLocations, isLoading: binsLoading } = useQuery({
    queryKey: ['warehouse-bins', viewingWarehouse?.id],
    queryFn: () => warehousesService.getBinLocations(viewingWarehouse!.id),
    enabled: !!viewingWarehouse,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWarehouseRequest) => warehousesService.createWarehouse(data),
    onSuccess: () => {
      message.success('Warehouse created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create warehouse');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWarehouseRequest> }) =>
      warehousesService.updateWarehouse(id, data),
    onSuccess: () => {
      message.success('Warehouse updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      handleCloseModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update warehouse');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesService.deleteWarehouse(id),
    onSuccess: () => {
      message.success('Warehouse deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: () => {
      message.error('Failed to delete warehouse');
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => warehousesService.setPrimary(id),
    onSuccess: () => {
      message.success('Primary warehouse updated');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
    onError: () => {
      message.error('Failed to set primary warehouse');
    },
  });

  const createBinMutation = useMutation({
    mutationFn: (data: CreateBinLocationRequest) =>
      warehousesService.createBinLocation(viewingWarehouse!.id, data),
    onSuccess: () => {
      message.success('Bin location created successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', viewingWarehouse?.id] });
      handleCloseBinModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to create bin location');
    },
  });

  const updateBinMutation = useMutation({
    mutationFn: ({ binId, data }: { binId: string; data: Partial<CreateBinLocationRequest> }) =>
      warehousesService.updateBinLocation(viewingWarehouse!.id, binId, data),
    onSuccess: () => {
      message.success('Bin location updated successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', viewingWarehouse?.id] });
      handleCloseBinModal();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error?.message || 'Failed to update bin location');
    },
  });

  const deleteBinMutation = useMutation({
    mutationFn: (binId: string) => warehousesService.deleteBinLocation(viewingWarehouse!.id, binId),
    onSuccess: () => {
      message.success('Bin location deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['warehouse-bins', viewingWarehouse?.id] });
    },
    onError: () => {
      message.error('Failed to delete bin location');
    },
  });

  const handleSearch = () => {
    setParams((prev) => ({ ...prev, search: searchText, page: 1 }));
  };

  const handleOpenModal = (warehouse?: Warehouse) => {
    setEditingWarehouse(warehouse || null);
    if (warehouse) {
      form.setFieldsValue(warehouse);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    form.resetFields();
  };

  const handleSubmit = (values: CreateWarehouseRequest) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = (warehouse: Warehouse) => {
    modal.confirm({
      title: 'Delete Warehouse',
      content: `Are you sure you want to delete "${warehouse.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(warehouse.id),
    });
  };

  const handleOpenBinModal = (bin?: BinLocation) => {
    setEditingBin(bin || null);
    if (bin) {
      binForm.setFieldsValue(bin);
    } else {
      binForm.resetFields();
    }
    setIsBinModalOpen(true);
  };

  const handleCloseBinModal = () => {
    setIsBinModalOpen(false);
    setEditingBin(null);
    binForm.resetFields();
  };

  const handleBinSubmit = (values: CreateBinLocationRequest) => {
    if (editingBin) {
      updateBinMutation.mutate({ binId: editingBin.id, data: values });
    } else {
      createBinMutation.mutate(values);
    }
  };

  const handleDeleteBin = (bin: BinLocation) => {
    modal.confirm({
      title: 'Delete Bin Location',
      content: `Are you sure you want to delete "${bin.name}"?`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => deleteBinMutation.mutate(bin.id),
    });
  };

  const getActionItems = (record: Warehouse): MenuProps['items'] => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: () => setViewingWarehouse(record),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit',
      onClick: () => handleOpenModal(record),
    },
    {
      key: 'primary',
      icon: record.isPrimary ? <StarFilled /> : <StarOutlined />,
      label: record.isPrimary ? 'Primary Warehouse' : 'Set as Primary',
      disabled: record.isPrimary,
      onClick: () => setPrimaryMutation.mutate(record.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete',
      danger: true,
      disabled: record.isPrimary,
      onClick: () => handleDelete(record),
    },
  ];

  const columns: ColumnsType<Warehouse> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string, record: Warehouse) => (
        <Space>
          <span className="font-mono">{code}</span>
          {record.isPrimary && <StarFilled className="text-yellow-500" />}
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => address || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Bin Locations',
      dataIndex: '_count',
      key: 'binCount',
      width: 120,
      align: 'center',
      render: (count: { binLocations: number } | undefined) => count?.binLocations || 0,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
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

  const binColumns: ColumnsType<BinLocation> = [
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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenBinModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBin(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Title level={4} className="mb-0">Warehouses</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Warehouse
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={16} md={12}>
            <Input
              placeholder="Search warehouses..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col>
            <Button onClick={handleSearch}>Search</Button>
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
            showTotal: (total) => `Total ${total} warehouses`,
            onChange: (page, pageSize) => {
              setParams((prev) => ({ ...prev, page, limit: pageSize }));
            },
          }}
          scroll={{ x: 900 }}
          size="middle"
        />
      </Card>

      {/* Warehouse Form Modal */}
      <Modal
        title={editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Warehouse Code" tooltip="Leave blank to auto-generate">
                <Input placeholder="Auto-generated" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Warehouse Name"
                rules={[{ required: true, message: 'Please enter warehouse name' }]}
              >
                <Input placeholder="Enter warehouse name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} placeholder="Enter warehouse address" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="Phone">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isPrimary" label="Primary Warehouse" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingWarehouse ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Warehouse Details Modal */}
      <Modal
        title={
          <Space>
            {viewingWarehouse?.name}
            {viewingWarehouse?.isPrimary && <Tag color="gold">Primary</Tag>}
          </Space>
        }
        open={!!viewingWarehouse}
        onCancel={() => setViewingWarehouse(null)}
        footer={null}
        width={800}
      >
        {viewingWarehouse && (
          <Tabs
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Code">{viewingWarehouse.code}</Descriptions.Item>
                    <Descriptions.Item label="Name">{viewingWarehouse.name}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{viewingWarehouse.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={viewingWarehouse.isActive ? 'green' : 'default'}>
                        {viewingWarehouse.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      {viewingWarehouse.address || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'bins',
                label: 'Bin Locations',
                children: (
                  <div>
                    <div className="flex justify-end mb-4">
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenBinModal()}
                      >
                        Add Bin Location
                      </Button>
                    </div>
                    <Table
                      dataSource={binLocations}
                      columns={binColumns}
                      rowKey="id"
                      loading={binsLoading}
                      pagination={false}
                      size="small"
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* Bin Location Form Modal */}
      <Modal
        title={editingBin ? 'Edit Bin Location' : 'New Bin Location'}
        open={isBinModalOpen}
        onCancel={handleCloseBinModal}
        footer={null}
      >
        <Form
          form={binForm}
          layout="vertical"
          onFinish={handleBinSubmit}
          initialValues={{ isActive: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Bin Code"
                rules={[{ required: true, message: 'Please enter bin code' }]}
              >
                <Input placeholder="e.g., A-01-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Bin Name"
                rules={[{ required: true, message: 'Please enter bin name' }]}
              >
                <Input placeholder="Enter bin name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Enter description" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={handleCloseBinModal}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createBinMutation.isPending || updateBinMutation.isPending}
              >
                {editingBin ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

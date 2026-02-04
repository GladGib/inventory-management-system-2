'use client';

import { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Row,
  Col,
  Button,
  Space,
} from 'antd';
import { BinLocation, CreateBinLocationRequest } from '@/services/warehouses-service';

interface BinModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateBinLocationRequest) => void;
  loading?: boolean;
  editingBin?: BinLocation | null;
}

export function BinModal({ open, onCancel, onSubmit, loading, editingBin }: BinModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingBin) {
        form.setFieldsValue({
          code: editingBin.code,
          name: editingBin.name,
          description: editingBin.description,
          zone: editingBin.zone,
          aisle: editingBin.aisle,
          rack: editingBin.rack,
          shelf: editingBin.shelf,
          capacity: editingBin.capacity,
          isActive: editingBin.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true });
      }
    }
  }, [open, editingBin, form]);

  const handleSubmit = (values: CreateBinLocationRequest) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={editingBin ? 'Edit Bin Location' : 'New Bin Location'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ isActive: true }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Bin Code"
              rules={[{ required: true, message: 'Please enter bin code' }]}
              tooltip="Unique code for this bin location (e.g., A-01-01-01)"
            >
              <Input placeholder="e.g., A-01-01-01" />
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="zone"
              label="Zone"
              tooltip="Warehouse zone (e.g., A, B, Receiving, Shipping)"
            >
              <Input placeholder="e.g., A, B, Receiving" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="aisle"
              label="Aisle"
              tooltip="Aisle number or identifier"
            >
              <Input placeholder="e.g., 01, 02" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="rack"
              label="Rack"
              tooltip="Rack or bay number"
            >
              <Input placeholder="e.g., 01, 02" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="shelf"
              label="Shelf"
              tooltip="Shelf level (e.g., 01 for ground level)"
            >
              <Input placeholder="e.g., 01, 02" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="capacity"
              label="Capacity"
              tooltip="Maximum storage capacity (units)"
              rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
            >
              <InputNumber className="w-full" placeholder="0" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Enter description" />
        </Form.Item>

        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingBin ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

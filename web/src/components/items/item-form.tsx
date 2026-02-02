'use client';

import { Form, Input, InputNumber, Select, Switch, Card, Row, Col, Button, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { itemsService, Item, CreateItemRequest } from '@/services/items-service';

interface ItemFormProps {
  initialValues?: Partial<Item>;
  onSubmit: (values: CreateItemRequest | Partial<CreateItemRequest>) => void;
  onCancel: () => void;
  loading?: boolean;
  isEdit?: boolean;
}

const itemTypes = [
  { value: 'SIMPLE', label: 'Simple' },
  { value: 'VARIANT_PARENT', label: 'Variant Parent' },
  { value: 'VARIANT', label: 'Variant' },
  { value: 'BUNDLE', label: 'Bundle' },
];

export function ItemForm({ initialValues, onSubmit, onCancel, loading, isEdit }: ItemFormProps) {
  const [form] = Form.useForm();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => itemsService.getCategories(),
  });

  const handleSubmit = (values: CreateItemRequest) => {
    if (isEdit) {
      // When editing, exclude fields that cannot be updated (code, type, uom)
      const { code, type, uom, ...updateValues } = values;
      onSubmit(updateValues);
    } else {
      onSubmit(values);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        type: 'SIMPLE',
        uom: 'pcs',
        trackInventory: true,
        isActive: true,
        costPrice: 0,
        ...initialValues,
      }}
      onFinish={handleSubmit}
    >
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Basic Information" className="mb-6">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="code"
                  label="Item Code"
                  tooltip="Leave blank to auto-generate"
                >
                  <Input placeholder="Auto-generated if empty" />
                </Form.Item>
              </Col>
              <Col xs={24} md={16}>
                <Form.Item
                  name="name"
                  label="Item Name"
                  rules={[{ required: true, message: 'Please enter item name' }]}
                >
                  <Input placeholder="Enter item name" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Enter item description" />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="type" label="Type">
                  <Select options={itemTypes} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="categoryId" label="Category">
                  <Select
                    allowClear
                    placeholder="Select category"
                    options={categories?.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="uom"
                  label="Unit of Measure"
                  rules={[{ required: true, message: 'Please enter UOM' }]}
                >
                  <Input placeholder="e.g., pcs, set, kg" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="barcode" label="Barcode">
              <Input placeholder="Enter barcode" />
            </Form.Item>
          </Card>

          <Card title="Pricing" className="mb-6">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="costPrice"
                  label="Cost Price (RM)"
                  rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
                >
                  <InputNumber
                    className="w-full"
                    precision={2}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="sellingPrice"
                  label="Selling Price (RM)"
                  rules={[
                    { required: true, message: 'Please enter selling price' },
                    { type: 'number', min: 0, message: 'Must be positive' },
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    precision={2}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="wholesalePrice"
                  label="Wholesale Price (RM)"
                  rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
                >
                  <InputNumber
                    className="w-full"
                    precision={2}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="minSellingPrice"
                  label="Min Selling Price (RM)"
                  rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
                >
                  <InputNumber
                    className="w-full"
                    precision={2}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Inventory Settings">
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="trackInventory" label="Track Inventory" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="reorderPoint"
                  label="Reorder Point"
                  rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
                >
                  <InputNumber className="w-full" placeholder="0" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="reorderQty"
                  label="Reorder Quantity"
                  rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
                >
                  <InputNumber className="w-full" placeholder="0" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Status" className="mb-6">
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          <Card>
            <Space direction="vertical" className="w-full">
              <Button type="primary" htmlType="submit" block loading={loading}>
                {initialValues?.id ? 'Update Item' : 'Create Item'}
              </Button>
              <Button block onClick={onCancel}>
                Cancel
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Form>
  );
}

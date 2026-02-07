'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Space, Tag, Alert, InputNumber, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';

// Usage:
// <VariantForm onSubmit={(data) => createVariants(data)} loading={false} />
// Attributes format: [{ name: "Size", values: ["S", "M", "L"] }, { name: "Color", values: ["Red", "Blue"] }]
// Preview shows total variants: 3 sizes x 2 colors = 6 variants

interface VariantAttribute {
  name: string;
  values: string[];
}

export interface VariantFormData {
  attributes: VariantAttribute[];
  basePrice?: number;
}

interface VariantFormProps {
  onSubmit: (data: VariantFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function VariantForm({ onSubmit, onCancel, loading }: VariantFormProps) {
  const [form] = Form.useForm();
  const [attributes, setAttributes] = useState<VariantAttribute[]>([]);
  const [currentAttrName, setCurrentAttrName] = useState('');
  const [currentAttrValue, setCurrentAttrValue] = useState('');

  // Calculate total variants that will be created
  const calculateVariantsCount = (): number => {
    if (attributes.length === 0) return 0;
    return attributes.reduce((total, attr) => total * attr.values.length, 1);
  };

  const handleAddAttribute = () => {
    const name = currentAttrName.trim();
    if (!name) return;

    const existing = attributes.find(
      (attr) => attr.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      // Attribute already exists, don't add duplicate
      setCurrentAttrName('');
      return;
    }

    setAttributes([...attributes, { name, values: [] }]);
    setCurrentAttrName('');
  };

  const handleRemoveAttribute = (name: string) => {
    setAttributes(attributes.filter((attr) => attr.name !== name));
  };

  const handleAddValue = (attrName: string) => {
    const value = currentAttrValue.trim();
    if (!value) return;

    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.name === attrName) {
          // Don't add duplicate values
          if (attr.values.includes(value)) {
            return attr;
          }
          return { ...attr, values: [...attr.values, value] };
        }
        return attr;
      })
    );
    setCurrentAttrValue('');
  };

  const handleRemoveValue = (attrName: string, value: string) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.name === attrName) {
          return { ...attr, values: attr.values.filter((v) => v !== value) };
        }
        return attr;
      })
    );
  };

  const handleSubmit = (values: any) => {
    if (attributes.length === 0) {
      form.setFields([
        {
          name: 'attributes',
          errors: ['Please add at least one variant attribute'],
        },
      ]);
      return;
    }

    const hasEmptyAttribute = attributes.some((attr) => attr.values.length === 0);
    if (hasEmptyAttribute) {
      form.setFields([
        {
          name: 'attributes',
          errors: ['Each attribute must have at least one value'],
        },
      ]);
      return;
    }

    onSubmit({
      attributes,
      basePrice: values.basePrice,
    });
  };

  const variantsCount = calculateVariantsCount();
  const attributesSummary = attributes
    .map((attr) => `${attr.values.length} ${attr.name}${attr.values.length > 1 ? 's' : ''}`)
    .join(' × ');

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Card title="Variant Attributes" className="mb-4">
        <div className="mb-4">
          <Space.Compact className="w-full">
            <Input
              placeholder="Attribute name (e.g., Size, Color)"
              value={currentAttrName}
              onChange={(e) => setCurrentAttrName(e.target.value)}
              onPressEnter={handleAddAttribute}
            />
            <Button type="primary" onClick={handleAddAttribute} icon={<PlusOutlined />}>
              Add Attribute
            </Button>
          </Space.Compact>
        </div>

        <Form.Item name="attributes" help={form.getFieldError('attributes')[0]}>
          <div className="space-y-4">
            {attributes.map((attr) => (
              <Card
                key={attr.name}
                size="small"
                title={
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{attr.name}</span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveAttribute(attr.name)}
                    >
                      Remove
                    </Button>
                  </div>
                }
                className="bg-gray-50"
              >
                <Space.Compact className="w-full mb-3">
                  <Input
                    placeholder={`Add ${attr.name} value (e.g., S, M, L)`}
                    value={currentAttrValue}
                    onChange={(e) => setCurrentAttrValue(e.target.value)}
                    onPressEnter={() => handleAddValue(attr.name)}
                  />
                  <Button
                    type="default"
                    onClick={() => handleAddValue(attr.name)}
                    icon={<PlusOutlined />}
                  >
                    Add
                  </Button>
                </Space.Compact>

                <div className="flex flex-wrap gap-2">
                  {attr.values.length === 0 ? (
                    <span className="text-gray-400 text-sm">No values added</span>
                  ) : (
                    attr.values.map((value) => (
                      <Tag
                        key={value}
                        closable
                        onClose={() => handleRemoveValue(attr.name, value)}
                        className="!text-sm !py-1 !px-3"
                      >
                        {value}
                      </Tag>
                    ))
                  )}
                </div>
              </Card>
            ))}

            {attributes.length === 0 && (
              <Alert
                message="No attributes added"
                description="Add variant attributes like Size, Color, Material, etc. Each attribute can have multiple values."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              />
            )}
          </div>
        </Form.Item>
      </Card>

      {variantsCount > 0 && (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Variants Preview</div>
              <div className="text-lg font-semibold text-blue-900">
                {variantsCount} variant{variantsCount > 1 ? 's' : ''} will be created
              </div>
              <div className="text-sm text-gray-600 mt-1">{attributesSummary}</div>
            </div>
            <div className="text-4xl font-bold text-blue-600">{variantsCount}</div>
          </div>
        </Card>
      )}

      <Card title="Pricing (Optional)" className="mb-4">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="basePrice"
              label="Base Price (RM)"
              help="Applied to all variants. You can adjust individual prices later."
              rules={[{ type: 'number', min: 0, message: 'Must be positive' }]}
            >
              <InputNumber
                className="w-full"
                precision={2}
                placeholder="0.00"
                prefix="RM"
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          disabled={variantsCount === 0}
        >
          Create {variantsCount} Variant{variantsCount > 1 ? 's' : ''}
        </Button>
      </div>
    </Form>
  );
}

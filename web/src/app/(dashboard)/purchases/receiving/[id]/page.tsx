'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Skeleton,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/ui';
import { purchasesService, GRNLine, GRNStatus } from '@/services/purchases-service';

const { Text, Title } = Typography;

const statusColors: Record<GRNStatus, string> = {
  DRAFT: 'default',
  CONFIRMED: 'green',
};

const statusLabels: Record<GRNStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
};

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: grn, isLoading } = useQuery({
    queryKey: ['grn', id],
    queryFn: () => purchasesService.getGRN(id),
    enabled: !!id,
  });

  const columns: ColumnsType<GRNLine> = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      width: 140,
      render: (code: string) => <span className="font-mono">{code}</span>,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'orderedQty',
      key: 'orderedQty',
      width: 120,
      align: 'right',
      render: (qty?: number) => qty ?? '-',
    },
    {
      title: 'Received Qty',
      dataIndex: 'quantityReceived',
      key: 'quantityReceived',
      width: 120,
      align: 'right',
      render: (qty: number) => <Text strong>{qty}</Text>,
    },
    {
      title: 'Bin Location',
      dataIndex: 'binLocationCode',
      key: 'binLocationCode',
      width: 140,
      render: (code?: string) => code || <Text type="secondary">-</Text>,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <Title level={4}>GRN not found</Title>
            <Button type="primary" onClick={() => router.push('/purchases/receiving')}>
              Back to List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const totalReceived = grn.lines.reduce((sum, line) => sum + line.quantityReceived, 0);

  return (
    <div className="p-6">
      <PageHeader
        title={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/purchases/receiving')}
            />
            <span>GRN: {grn.grnNumber}</span>
            <Tag color={statusColors[grn.status]}>{statusLabels[grn.status]}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
              Print
            </Button>
            {grn.purchaseOrderId && (
              <Button
                icon={<FileTextOutlined />}
                onClick={() => router.push(`/purchases/orders/${grn.purchaseOrderId}`)}
              >
                View PO
              </Button>
            )}
          </Space>
        }
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Received Items" className="mb-6">
            <Table
              dataSource={grn.lines}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="middle"
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text strong>{totalReceived}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="GRN Details" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="GRN Number">
                <Text strong className="font-mono">{grn.grnNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[grn.status]}>{statusLabels[grn.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Receive Date">
                {dayjs(grn.receiveDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Warehouse">
                {grn.warehouseName || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Vendor Information" className="mb-6">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Vendor">
                <Text strong>{grn.vendorName}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Vendor Code">
                <Text className="font-mono">{grn.vendorCode}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {grn.purchaseOrderId && (
            <Card title="Purchase Order" className="mb-6">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="PO Number">
                  <Button
                    type="link"
                    className="p-0 font-mono"
                    onClick={() => router.push(`/purchases/orders/${grn.purchaseOrderId}`)}
                  >
                    {grn.poNumber}
                  </Button>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {grn.notes && (
            <Card title="Notes" className="mb-6">
              <Text>{grn.notes}</Text>
            </Card>
          )}

          <Card title="Timeline" size="small">
            <div className="text-sm text-gray-500">
              <div>Created: {dayjs(grn.createdAt).format('DD/MM/YYYY HH:mm')}</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentResponseDto,
} from './dto';

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  private async generateShipmentNumber(organizationId: string): Promise<string> {
    return this.organizationsService.getNextNumber(organizationId, 'SHP');
  }

  async create(
    organizationId: string,
    salesOrderId: string,
    dto: CreateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    // Verify sales order exists and is in correct status
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId, organizationId },
      include: {
        lines: true,
        shipments: {
          include: { lines: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (!['CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED'].includes(order.status)) {
      throw new BadRequestException(
        'Order must be confirmed before shipping',
      );
    }

    // Calculate already shipped quantities
    const shippedQty = new Map<string, number>();
    for (const shipment of order.shipments) {
      for (const line of shipment.lines) {
        const current = shippedQty.get(line.itemId) || 0;
        shippedQty.set(line.itemId, current + line.quantity);
      }
    }

    // Validate quantities
    for (const line of dto.lines) {
      const orderLine = order.lines.find((ol) => ol.itemId === line.itemId);
      if (!orderLine) {
        throw new BadRequestException(
          `Item ${line.itemId} is not in the sales order`,
        );
      }

      const alreadyShipped = shippedQty.get(line.itemId) || 0;
      const available = orderLine.quantity - alreadyShipped;

      if (line.quantity > available) {
        throw new BadRequestException(
          `Cannot ship ${line.quantity} of item ${line.itemId}. Only ${available} available.`,
        );
      }
    }

    // Generate shipment number
    const shipmentNumber = await this.generateShipmentNumber(organizationId);

    // Create shipment
    const shipment = await this.prisma.shipment.create({
      data: {
        organizationId,
        salesOrderId,
        shipmentNumber,
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : new Date(),
        notes: dto.notes,
        status: 'SHIPPED',
        lines: {
          create: dto.lines.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            notes: line.notes,
          })),
        },
      },
      include: {
        lines: true,
        salesOrder: true,
      },
    });

    // Update order line shipped quantities
    for (const line of dto.lines) {
      await this.prisma.salesOrderLine.updateMany({
        where: {
          salesOrderId,
          itemId: line.itemId,
        },
        data: {
          shippedQty: {
            increment: line.quantity,
          },
        },
      });
    }

    // Check if all items are shipped and update order status
    const updatedOrder = await this.prisma.salesOrder.findFirst({
      where: { id: salesOrderId },
      include: { lines: true },
    });

    const allShipped = updatedOrder?.lines.every(
      (line) => line.shippedQty >= line.quantity,
    );

    if (allShipped) {
      await this.prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: 'SHIPPED' },
      });
    }

    return this.toShipmentResponse(shipment);
  }

  async findAll(
    organizationId: string,
    salesOrderId: string,
  ): Promise<ShipmentResponseDto[]> {
    const shipments = await this.prisma.shipment.findMany({
      where: { organizationId, salesOrderId },
      include: {
        lines: true,
        salesOrder: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(shipments.map((s) => this.toShipmentResponse(s)));
  }

  async findOne(
    organizationId: string,
    shipmentId: string,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, organizationId },
      include: {
        lines: true,
        salesOrder: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return this.toShipmentResponse(shipment);
  }

  async update(
    organizationId: string,
    shipmentId: string,
    dto: UpdateShipmentDto,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, organizationId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Determine status based on dates
    let status = shipment.status;
    if (dto.deliveredDate) {
      status = 'DELIVERED';
    } else if (dto.shipDate && !shipment.shipDate) {
      status = 'SHIPPED';
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        carrier: dto.carrier,
        trackingNumber: dto.trackingNumber,
        shipDate: dto.shipDate ? new Date(dto.shipDate) : undefined,
        deliveredDate: dto.deliveredDate ? new Date(dto.deliveredDate) : undefined,
        notes: dto.notes,
        status,
      },
      include: {
        lines: true,
        salesOrder: true,
      },
    });

    return this.toShipmentResponse(updated);
  }

  async markDelivered(
    organizationId: string,
    shipmentId: string,
  ): Promise<ShipmentResponseDto> {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, organizationId },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'DELIVERED',
        deliveredDate: new Date(),
      },
      include: {
        lines: true,
        salesOrder: true,
      },
    });

    // Check if all shipments are delivered and update order status
    const allShipments = await this.prisma.shipment.findMany({
      where: { salesOrderId: shipment.salesOrderId },
    });

    const allDelivered = allShipments.every((s) => s.status === 'DELIVERED');

    if (allDelivered) {
      await this.prisma.salesOrder.update({
        where: { id: shipment.salesOrderId },
        data: { status: 'CLOSED' },
      });
    }

    return this.toShipmentResponse(updated);
  }

  async getShipmentForPdf(organizationId: string, shipmentId: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, organizationId },
      include: {
        salesOrder: {
          include: {
            organization: true,
            customer: true,
            warehouse: true,
          },
        },
        lines: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Get item details for lines
    const itemIds = shipment.lines.map((l) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    return {
      shipmentNumber: shipment.shipmentNumber,
      orderNumber: shipment.salesOrder.orderNumber,
      shipDate: shipment.shipDate || undefined,
      carrier: shipment.carrier || undefined,
      trackingNumber: shipment.trackingNumber || undefined,
      organization: {
        name: shipment.salesOrder.organization.name,
        address: shipment.salesOrder.organization.address || undefined,
        phone: shipment.salesOrder.organization.phone || undefined,
      },
      customer: {
        companyName: shipment.salesOrder.customer.companyName,
        phone: shipment.salesOrder.customer.phone || undefined,
      },
      shippingAddress: shipment.salesOrder.shippingAddress || undefined,
      lines: shipment.lines.map((line) => {
        const item = itemMap.get(line.itemId);
        return {
          itemCode: item?.code || '',
          itemName: item?.name || '',
          quantity: line.quantity,
        };
      }),
      notes: shipment.notes || undefined,
    };
  }

  private async toShipmentResponse(shipment: any): Promise<ShipmentResponseDto> {
    // Get item details for lines
    const itemIds = shipment.lines.map((l: any) => l.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    const itemMap = new Map(items.map((i) => [i.id, i]));

    return {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      salesOrderId: shipment.salesOrderId,
      orderNumber: shipment.salesOrder?.orderNumber || '',
      status: shipment.status,
      carrier: shipment.carrier || undefined,
      trackingNumber: shipment.trackingNumber || undefined,
      shipDate: shipment.shipDate || undefined,
      deliveredDate: shipment.deliveredDate || undefined,
      notes: shipment.notes || undefined,
      lines: shipment.lines.map((line: any) => {
        const item = itemMap.get(line.itemId);
        return {
          id: line.id,
          itemId: line.itemId,
          itemCode: item?.code || '',
          itemName: item?.name || '',
          quantity: line.quantity,
          notes: line.notes || undefined,
        };
      }),
      createdAt: shipment.createdAt,
    };
  }
}

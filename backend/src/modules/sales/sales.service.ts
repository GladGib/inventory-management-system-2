import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  SalesOrderResponseDto,
  SalesOrderSummaryDto,
  SalesOrderLineResponseDto,
  CreateSalesOrderLineDto,
  UpdateSalesOrderLineDto,
  ConfirmOrderDto,
  CreatePickListDto,
  ProcessPickListDto,
  PickListResponseDto,
  SalesOrderStatus,
} from './dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private organizationsService: OrganizationsService,
  ) {}

  async create(organizationId: string, dto: CreateSalesOrderDto): Promise<SalesOrderResponseDto> {
    // Validate customer
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Generate order number
    const orderNumber = dto.orderNumber ||
      await this.organizationsService.getNextNumber(organizationId, 'SO');

    // Get default warehouse if not specified
    let warehouseId = dto.warehouseId;
    if (!warehouseId) {
      const primaryWarehouse = await this.prisma.warehouse.findFirst({
        where: { organizationId, isPrimary: true, deletedAt: null },
      });
      warehouseId = primaryWarehouse?.id;
    }

    // Validate and prepare lines
    const lineData = await this.prepareOrderLines(organizationId, dto.lines);

    // Calculate totals
    const { subtotal, taxAmount, totalAmount } = this.calculateOrderTotals(
      lineData,
      dto.discountPercent,
      dto.discountAmount,
    );

    if (!warehouseId) {
      throw new BadRequestException('Warehouse must be specified');
    }

    const salesOrder = await this.prisma.salesOrder.create({
      data: {
        organizationId,
        orderNumber,
        customerId: dto.customerId,
        warehouseId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedShipDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
        status: 'DRAFT',
        subtotal,
        discountAmount: dto.discountAmount || 0,
        taxAmount,
        total: totalAmount,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        lines: {
          create: lineData.map((line) => ({
            itemId: line.itemId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPct: line.discountPercent || 0,
            taxPct: line.taxPct || 0,
            lineTotal: line.lineTotal,
            notes: line.notes,
          })),
        },
      },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toSalesOrderResponse(salesOrder);
  }

  async findAll(
    organizationId: string,
    options?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      customerId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      organizationId,
    };

    if (options?.search) {
      where.OR = [
        { orderNumber: { contains: options.search, mode: 'insensitive' } },
        { customer: { companyName: { contains: options.search, mode: 'insensitive' } } },
        { customer: { code: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    if (options?.fromDate) {
      where.orderDate = { ...where.orderDate, gte: new Date(options.fromDate) };
    }

    if (options?.toDate) {
      where.orderDate = { ...where.orderDate, lte: new Date(options.toDate) };
    }

    const [orders, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: {
          customer: true,
          _count: { select: { lines: true } },
        },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return {
      data: orders.map((o: any) => this.toSalesOrderSummary(o)),
      meta: { total, page, limit },
    };
  }

  async findOne(organizationId: string, id: string): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    return this.toSalesOrderResponse(order);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateSalesOrderDto,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Can only update draft orders');
    }

    // Recalculate totals if discount changed
    let subtotal = Number(order.subtotal);
    let taxAmount = Number(order.taxAmount);
    let totalAmount = Number(order.total);

    if (dto.discountPercent !== undefined || dto.discountAmount !== undefined) {
      const lineData = order.lines.map((line: any) => ({
        lineTotal: Number(line.lineTotal),
        taxAmount: Number(line.taxPct) * Number(line.lineTotal) / 100,
      }));

      const totals = this.calculateOrderTotals(
        lineData,
        dto.discountPercent ?? undefined,
        dto.discountAmount ?? Number(order.discountAmount) ?? undefined,
      );

      subtotal = totals.subtotal;
      taxAmount = totals.taxAmount;
      totalAmount = totals.totalAmount;
    }

    const updateData: any = { ...dto };
    if (dto.expectedDate) {
      updateData.expectedShipDate = new Date(dto.expectedDate);
      delete updateData.expectedDate;
    }
    if (dto.discountPercent !== undefined) {
      delete updateData.discountPercent;
    }
    if (dto.shippingAddressId !== undefined) {
      delete updateData.shippingAddressId;
    }
    if (dto.billingAddressId !== undefined) {
      delete updateData.billingAddressId;
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        ...updateData,
        subtotal,
        taxAmount,
        total: totalAmount,
      },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toSalesOrderResponse(updated);
  }

  async addLine(
    organizationId: string,
    orderId: string,
    dto: CreateSalesOrderLineDto,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, organizationId },
      include: { lines: true },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Can only add lines to draft orders');
    }

    const lineData = await this.prepareOrderLines(organizationId, [dto]);
    const line = lineData[0];

    await this.prisma.salesOrderLine.create({
      data: {
        salesOrderId: orderId,
        itemId: line.itemId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPct: line.discountPercent || 0,
        taxPct: line.taxPct || 0,
        lineTotal: line.lineTotal,
        notes: line.notes,
      },
    });

    // Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    return this.findOne(organizationId, orderId);
  }

  async updateLine(
    organizationId: string,
    orderId: string,
    lineId: string,
    dto: UpdateSalesOrderLineDto,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, organizationId },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Can only update lines on draft orders');
    }

    const line = await this.prisma.salesOrderLine.findFirst({
      where: { id: lineId, salesOrderId: orderId },
      include: { item: true },
    });

    if (!line) {
      throw new NotFoundException('Order line not found');
    }

    // Recalculate line
    const quantity = dto.quantity ?? line.quantity;
    const unitPrice = dto.unitPrice ?? Number(line.unitPrice);
    const discountPct = dto.discountPercent ?? Number(line.discountPct) ?? 0;

    let lineTotal = quantity * unitPrice;
    if (discountPct > 0) {
      lineTotal -= lineTotal * (discountPct / 100);
    }

    const taxRate = line.item.taxRateId
      ? await this.prisma.taxRate.findUnique({ where: { id: line.item.taxRateId } })
      : null;
    const taxPct = taxRate ? Number(taxRate.rate) : 0;

    await this.prisma.salesOrderLine.update({
      where: { id: lineId },
      data: {
        quantity,
        unitPrice,
        discountPct,
        taxPct,
        lineTotal,
        notes: dto.notes,
      },
    });

    await this.recalculateOrderTotals(orderId);

    return this.findOne(organizationId, orderId);
  }

  async removeLine(
    organizationId: string,
    orderId: string,
    lineId: string,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, organizationId },
      include: { lines: true },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Can only remove lines from draft orders');
    }

    if (order.lines.length <= 1) {
      throw new BadRequestException('Order must have at least one line');
    }

    const line = order.lines.find((l: any) => l.id === lineId);
    if (!line) {
      throw new NotFoundException('Order line not found');
    }

    await this.prisma.salesOrderLine.delete({ where: { id: lineId } });
    await this.recalculateOrderTotals(orderId);

    return this.findOne(organizationId, orderId);
  }

  async confirm(
    organizationId: string,
    id: string,
    dto?: ConfirmOrderDto,
  ): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Order is not in draft status');
    }

    const warehouseId = dto?.warehouseId || order.warehouseId;
    if (!warehouseId) {
      throw new BadRequestException('Warehouse must be specified');
    }

    // Allocate stock (commit inventory)
    for (const line of order.lines) {
      if (line.item.trackInventory) {
        const stockLevel = await this.prisma.stockLevel.findFirst({
          where: {
            itemId: line.itemId,
            warehouseId,
          },
        });

        if (!stockLevel || stockLevel.onHand - stockLevel.committed < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for item ${line.item.code}`,
          );
        }

        await this.prisma.stockLevel.update({
          where: { id: stockLevel.id },
          data: { committed: { increment: line.quantity } },
        });
      }
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        warehouseId,
      },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toSalesOrderResponse(updated);
  }

  async cancel(organizationId: string, id: string): Promise<SalesOrderResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    // Release committed stock if confirmed
    if (order.status === 'CONFIRMED' && order.warehouseId) {
      for (const line of order.lines) {
        if (line.item.trackInventory) {
          const stockLevel = await this.prisma.stockLevel.findFirst({
            where: {
              itemId: line.itemId,
              warehouseId: order.warehouseId,
            },
          });

          if (stockLevel) {
            await this.prisma.stockLevel.update({
              where: { id: stockLevel.id },
              data: { committed: { decrement: line.quantity } },
            });
          }
        }
      }
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        warehouse: true,
        lines: {
          include: { item: true },
        },
      },
    });

    return this.toSalesOrderResponse(updated);
  }

  async createPickList(
    organizationId: string,
    orderId: string,
    dto?: CreatePickListDto,
  ): Promise<PickListResponseDto> {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id: orderId, organizationId },
      include: { lines: { include: { item: true } } },
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    if (!['CONFIRMED', 'PICKING'].includes(order.status)) {
      throw new BadRequestException('Order must be confirmed to create pick list');
    }

    const pickNumber = await this.organizationsService.getNextNumber(organizationId, 'PL');

    const linesToPick = dto?.lineIds
      ? order.lines.filter((l: any) => dto.lineIds!.includes(l.id))
      : order.lines.filter((l: any) => l.quantity > l.pickedQty);

    if (linesToPick.length === 0) {
      throw new BadRequestException('No items to pick');
    }

    const pickList = await this.prisma.pickList.create({
      data: {
        pickNumber,
        salesOrderId: orderId,
        status: 'PENDING',
        lines: {
          create: linesToPick.map((line: any) => ({
            itemId: line.itemId,
            qtyToPick: line.quantity - line.pickedQty,
            qtyPicked: 0,
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    // Update order status
    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'PICKING' },
    });

    return this.toPickListResponse(pickList, order.orderNumber);
  }

  async processPickList(
    organizationId: string,
    pickListId: string,
    dto: ProcessPickListDto,
  ): Promise<PickListResponseDto> {
    const pickList = await this.prisma.pickList.findFirst({
      where: { id: pickListId },
      include: {
        salesOrder: true,
        lines: true,
      },
    });

    if (!pickList) {
      throw new NotFoundException('Pick list not found');
    }

    if (pickList.salesOrder.organizationId !== organizationId) {
      throw new NotFoundException('Pick list not found');
    }

    if (pickList.status !== 'PENDING') {
      throw new BadRequestException('Pick list already processed');
    }

    // Process each line
    for (const pickLine of dto.lines) {
      const line = pickList.lines.find((l: any) => l.id === pickLine.lineId);
      if (!line) {
        throw new BadRequestException(`Pick list line ${pickLine.lineId} not found`);
      }

      if (pickLine.quantityPicked > line.qtyToPick) {
        throw new BadRequestException(
          `Cannot pick more than requested`,
        );
      }

      await this.prisma.pickListLine.update({
        where: { id: pickLine.lineId },
        data: {
          qtyPicked: pickLine.quantityPicked,
          binLocation: pickLine.binLocationId,
        },
      });
    }

    // Complete pick list
    const updated = await this.prisma.pickList.update({
      where: { id: pickListId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        lines: true,
      },
    });

    // Check if all items picked - update order status
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: pickList.salesOrderId },
      include: { lines: true },
    });

    if (order) {
      const allPicked = order.lines.every((l: any) => l.pickedQty >= l.quantity);
      if (allPicked) {
        await this.prisma.salesOrder.update({
          where: { id: order.id },
          data: { status: 'PACKED' },
        });
      }
    }

    return this.toPickListResponse(updated, order?.orderNumber || '');
  }

  // Helpers
  private async prepareOrderLines(
    organizationId: string,
    lines: CreateSalesOrderLineDto[],
  ) {
    const preparedLines = [];

    for (const line of lines) {
      const item = await this.prisma.item.findFirst({
        where: { id: line.itemId, organizationId, deletedAt: null },
        include: { taxRate: true },
      });

      if (!item) {
        throw new NotFoundException(`Item ${line.itemId} not found`);
      }

      const unitPrice = line.unitPrice ?? Number(item.sellingPrice);
      let lineTotal = line.quantity * unitPrice;

      if (line.discountPercent) {
        lineTotal -= lineTotal * (line.discountPercent / 100);
      }
      if (line.discountAmount) {
        lineTotal -= line.discountAmount;
      }

      const taxAmount = item.taxRate
        ? lineTotal * (Number(item.taxRate.rate) / 100)
        : 0;

      preparedLines.push({
        itemId: item.id,
        quantity: line.quantity,
        unitPrice,
        discountPercent: line.discountPercent,
        discountAmount: line.discountAmount,
        taxPct: item.taxRate ? Number(item.taxRate.rate) : 0,
        taxAmount,
        lineTotal,
        notes: line.notes,
      });
    }

    return preparedLines;
  }

  private calculateOrderTotals(
    lines: { lineTotal: number; taxAmount: number }[],
    discountPercent?: number,
    discountAmount?: number,
  ) {
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    let discountedSubtotal = subtotal;

    if (discountPercent) {
      discountedSubtotal -= subtotal * (discountPercent / 100);
    }
    if (discountAmount) {
      discountedSubtotal -= discountAmount;
    }

    const taxRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1;
    const taxAmount = lines.reduce((sum, l) => sum + l.taxAmount, 0) * taxRatio;
    const totalAmount = discountedSubtotal + taxAmount;

    return { subtotal, taxAmount, totalAmount };
  }

  private async recalculateOrderTotals(orderId: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });

    if (!order) return;

    const lineData = order.lines.map((l: any) => ({
      lineTotal: Number(l.lineTotal),
      taxAmount: Number(l.taxPct) * Number(l.lineTotal) / 100,
    }));

    const { subtotal, taxAmount, totalAmount } = this.calculateOrderTotals(
      lineData,
      undefined,
      order.discountAmount ? Number(order.discountAmount) : undefined,
    );

    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: { subtotal, taxAmount, total: totalAmount },
    });
  }

  private toSalesOrderResponse(order: any): SalesOrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerCode: order.customer.code,
      customerName: order.customer.companyName,
      orderDate: order.orderDate,
      expectedDate: order.expectedShipDate,
      status: order.status as SalesOrderStatus,
      warehouseId: order.warehouseId,
      warehouseName: order.warehouse?.name,
      shippingAddressId: undefined,
      billingAddressId: undefined,
      subtotal: Number(order.subtotal),
      discountPercent: undefined,
      discountAmount: order.discountAmount ? Number(order.discountAmount) : undefined,
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.total),
      notes: order.notes,
      internalNotes: order.internalNotes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      lines: order.lines?.map((l: any) => this.toLineResponse(l)),
    };
  }

  private toSalesOrderSummary(order: any): SalesOrderSummaryDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerCode: order.customer.code,
      customerName: order.customer.companyName,
      orderDate: order.orderDate,
      status: order.status as SalesOrderStatus,
      totalAmount: Number(order.total),
      lineCount: order._count?.lines || 0,
    };
  }

  private toLineResponse(line: any): SalesOrderLineResponseDto {
    return {
      id: line.id,
      itemId: line.itemId,
      itemCode: line.item.code,
      itemName: line.item.name,
      quantity: line.quantity,
      quantityPicked: line.pickedQty,
      quantityShipped: line.shippedQty,
      unitPrice: Number(line.unitPrice),
      discountPercent: Number(line.discountPct),
      discountAmount: undefined,
      lineTotal: Number(line.lineTotal),
      taxAmount: Number(line.taxPct),
      notes: line.notes,
    };
  }

  private toPickListResponse(pickList: any, orderNumber: string): PickListResponseDto {
    return {
      id: pickList.id,
      pickListNumber: pickList.pickNumber,
      salesOrderId: pickList.salesOrderId,
      salesOrderNumber: orderNumber,
      status: pickList.status,
      createdAt: pickList.createdAt,
      completedAt: pickList.completedAt,
      lines: pickList.lines.map((l: any) => ({
        id: l.id,
        itemId: l.itemId,
        itemCode: undefined,
        itemName: undefined,
        quantityToPick: l.qtyToPick,
        quantityPicked: l.qtyPicked,
        binLocationId: undefined,
        binLocationCode: l.binLocation,
      })),
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';

describe('SalesService', () => {
  let service: SalesService;
  let prisma: PrismaService;

  const mockCustomer = {
    id: 'cust1',
    code: 'CUST001',
    companyName: 'Test Customer',
    billingAddress: '123 Test St',
    phone: '1234567890',
    email: 'test@customer.com',
  };

  const mockWarehouse = {
    id: 'wh1',
    name: 'Main Warehouse',
    isPrimary: true,
  };

  const mockItem = {
    id: 'item1',
    code: 'ITEM001',
    name: 'Test Item',
    sellingPrice: 100,
    trackInventory: true,
    taxRate: { rate: 6 },
  };

  const mockSalesOrder = {
    id: 'so1',
    orderNumber: 'SO-000001',
    organizationId: 'org1',
    customerId: 'cust1',
    warehouseId: 'wh1',
    orderDate: new Date(),
    status: 'DRAFT',
    subtotal: 100,
    discountAmount: 0,
    taxAmount: 6,
    total: 106,
    customer: mockCustomer,
    warehouse: mockWarehouse,
    lines: [
      {
        id: 'line1',
        itemId: 'item1',
        quantity: 1,
        unitPrice: 100,
        discountPct: 0,
        taxPct: 6,
        lineTotal: 100,
        pickedQty: 0,
        shippedQty: 0,
        item: mockItem,
      },
    ],
  };

  const mockPrismaService = {
    salesOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    salesOrderLine: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
    },
    taxRate: {
      findUnique: jest.fn(),
    },
    stockLevel: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    pickList: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    pickListLine: {
      update: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  const mockOrganizationsService = {
    getNextNumber: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockOrganizationsService.getNextNumber.mockResolvedValue('SO-000001');
      mockPrismaService.salesOrder.create.mockResolvedValue(mockSalesOrder);
    });

    it('should create a sales order successfully', async () => {
      const result = await service.create('org1', {
        customerId: 'cust1',
        lines: [{ itemId: 'item1', quantity: 1 }],
      });

      expect(result.orderNumber).toBe('SO-000001');
      expect(result.status).toBe('DRAFT');
      expect(mockPrismaService.salesOrder.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          customerId: 'invalid',
          lines: [{ itemId: 'item1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should use provided order number when given', async () => {
      mockPrismaService.salesOrder.create.mockResolvedValue({
        ...mockSalesOrder,
        orderNumber: 'CUSTOM-001',
      });

      const result = await service.create('org1', {
        customerId: 'cust1',
        orderNumber: 'CUSTOM-001',
        lines: [{ itemId: 'item1', quantity: 1 }],
      });

      expect(result.orderNumber).toBe('CUSTOM-001');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          customerId: 'cust1',
          lines: [{ itemId: 'invalid', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated sales orders', async () => {
      mockPrismaService.salesOrder.findMany.mockResolvedValue([mockSalesOrder]);
      mockPrismaService.salesOrder.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.salesOrder.findMany.mockResolvedValue([mockSalesOrder]);
      mockPrismaService.salesOrder.count.mockResolvedValue(1);

      await service.findAll('org1', { status: 'DRAFT' });

      expect(mockPrismaService.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'DRAFT' }),
        }),
      );
    });

    it('should filter by customer', async () => {
      mockPrismaService.salesOrder.findMany.mockResolvedValue([mockSalesOrder]);
      mockPrismaService.salesOrder.count.mockResolvedValue(1);

      await service.findAll('org1', { customerId: 'cust1' });

      expect(mockPrismaService.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return order when found', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);

      const result = await service.findOne('org1', 'so1');

      expect(result.id).toBe('so1');
      expect(result.orderNumber).toBe('SO-000001');
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update draft order successfully', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);
      mockPrismaService.salesOrder.update.mockResolvedValue({
        ...mockSalesOrder,
        notes: 'Updated notes',
      });

      const result = await service.update('org1', 'so1', {
        notes: 'Updated notes',
      });

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw BadRequestException when order is not draft', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
      });

      await expect(
        service.update('org1', 'so1', { notes: 'Updated' }),
      ).rejects.toThrow('Can only update draft orders');
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'invalid', { notes: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('should confirm order and allocate stock', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue({
        id: 'sl1',
        onHand: 100,
        committed: 0,
      });
      mockPrismaService.stockLevel.update.mockResolvedValue({});
      mockPrismaService.salesOrder.update.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
      });

      const result = await service.confirm('org1', 'so1');

      expect(result.status).toBe('CONFIRMED');
      expect(mockPrismaService.stockLevel.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not draft', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
      });

      await expect(service.confirm('org1', 'so1')).rejects.toThrow(
        'Order is not in draft status',
      );
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue({
        id: 'sl1',
        onHand: 0,
        committed: 0,
      });

      await expect(service.confirm('org1', 'so1')).rejects.toThrow(
        'Insufficient stock',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel draft order', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);
      mockPrismaService.salesOrder.update.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CANCELLED',
      });

      const result = await service.cancel('org1', 'so1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should release committed stock when cancelling confirmed order', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
      });
      mockPrismaService.stockLevel.findFirst.mockResolvedValue({
        id: 'sl1',
        committed: 1,
      });
      mockPrismaService.stockLevel.update.mockResolvedValue({});
      mockPrismaService.salesOrder.update.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CANCELLED',
      });

      await service.cancel('org1', 'so1');

      expect(mockPrismaService.stockLevel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { committed: { decrement: 1 } },
        }),
      );
    });

    it('should throw BadRequestException when order cannot be cancelled', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'SHIPPED',
      });

      await expect(service.cancel('org1', 'so1')).rejects.toThrow(
        'Cannot cancel order in current status',
      );
    });
  });

  describe('addLine', () => {
    it('should add line to draft order', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        lines: [],
      });
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.salesOrderLine.create.mockResolvedValue({});
      mockPrismaService.salesOrder.update.mockResolvedValue(mockSalesOrder);

      const result = await service.addLine('org1', 'so1', {
        itemId: 'item1',
        quantity: 1,
      });

      expect(mockPrismaService.salesOrderLine.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when order is not draft', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
      });

      await expect(
        service.addLine('org1', 'so1', { itemId: 'item1', quantity: 1 }),
      ).rejects.toThrow('Can only add lines to draft orders');
    });
  });

  describe('removeLine', () => {
    it('should remove line from draft order', async () => {
      const lineWithItem = {
        id: 'line1',
        itemId: 'item1',
        quantity: 1,
        unitPrice: 100,
        discountPct: 0,
        taxPct: 6,
        lineTotal: 100,
        pickedQty: 0,
        shippedQty: 0,
        item: mockItem,
      };
      mockPrismaService.salesOrder.findFirst
        .mockResolvedValueOnce({
          ...mockSalesOrder,
          lines: [lineWithItem, { ...lineWithItem, id: 'line2' }],
        })
        .mockResolvedValueOnce({
          ...mockSalesOrder,
          lines: [{ ...lineWithItem, id: 'line2' }],
        });
      mockPrismaService.salesOrderLine.delete.mockResolvedValue({});
      mockPrismaService.salesOrder.update.mockResolvedValue(mockSalesOrder);

      await service.removeLine('org1', 'so1', 'line1');

      expect(mockPrismaService.salesOrderLine.delete).toHaveBeenCalledWith({
        where: { id: 'line1' },
      });
    });

    it('should throw BadRequestException when removing last line', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);

      await expect(
        service.removeLine('org1', 'so1', 'line1'),
      ).rejects.toThrow('Order must have at least one line');
    });

    it('should throw NotFoundException when line not found', async () => {
      const lineWithItem = { ...mockSalesOrder.lines[0] };
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        lines: [lineWithItem, { ...lineWithItem, id: 'line2' }],
      });

      await expect(
        service.removeLine('org1', 'so1', 'invalid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPickList', () => {
    it('should create pick list for confirmed order', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
        lines: [{ ...mockSalesOrder.lines[0], pickedQty: 0 }],
      });
      mockOrganizationsService.getNextNumber.mockResolvedValue('PL-000001');
      mockPrismaService.pickList.create.mockResolvedValue({
        id: 'pl1',
        pickNumber: 'PL-000001',
        salesOrderId: 'so1',
        status: 'PENDING',
        lines: [],
      });
      mockPrismaService.salesOrder.update.mockResolvedValue({});

      const result = await service.createPickList('org1', 'so1');

      expect(result.pickListNumber).toBe('PL-000001');
      expect(mockPrismaService.salesOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PICKING' },
        }),
      );
    });

    it('should throw BadRequestException when order not confirmed', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);

      await expect(service.createPickList('org1', 'so1')).rejects.toThrow(
        'Order must be confirmed to create pick list',
      );
    });

    it('should throw BadRequestException when no items to pick', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'CONFIRMED',
        lines: [{ ...mockSalesOrder.lines[0], pickedQty: 1 }],
      });

      await expect(service.createPickList('org1', 'so1')).rejects.toThrow(
        'No items to pick',
      );
    });
  });
});

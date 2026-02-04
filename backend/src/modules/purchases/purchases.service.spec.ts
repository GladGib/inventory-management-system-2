import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';

describe('PurchasesService', () => {
  let service: PurchasesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockVendor = {
    id: 'vendor1',
    organizationId: 'org1',
    code: 'V001',
    companyName: 'Test Vendor',
    deletedAt: null,
  };

  const mockWarehouse = {
    id: 'wh1',
    organizationId: 'org1',
    code: 'WH001',
    name: 'Main Warehouse',
    isPrimary: true,
    deletedAt: null,
  };

  const mockItem = {
    id: 'item1',
    organizationId: 'org1',
    code: 'ITEM001',
    name: 'Test Item',
    costPrice: 10,
    sellingPrice: 15,
    taxRate: { rate: 6 },
  };

  const mockPurchaseOrder = {
    id: 'po1',
    organizationId: 'org1',
    orderNumber: 'PO-0001',
    vendorId: 'vendor1',
    warehouseId: 'wh1',
    status: 'DRAFT',
    orderDate: new Date(),
    subtotal: 100,
    taxAmount: 6,
    total: 106,
    vendor: mockVendor,
    warehouse: mockWarehouse,
    lines: [
      {
        id: 'line1',
        itemId: 'item1',
        quantity: 10,
        unitPrice: 10,
        discountPct: 0,
        taxPct: 6,
        lineTotal: 106,
        quantityReceived: 0,
        item: mockItem,
      },
    ],
  };

  const mockGRN = {
    id: 'grn1',
    organizationId: 'org1',
    grnNumber: 'GRN-0001',
    purchaseOrderId: 'po1',
    vendorId: 'vendor1',
    warehouseId: 'wh1',
    receivedDate: new Date(),
    status: 'RECEIVED',
    purchaseOrder: mockPurchaseOrder,
    vendor: mockVendor,
    warehouse: mockWarehouse,
    lines: [
      {
        id: 'grnline1',
        itemId: 'item1',
        quantityReceived: 10,
        unitCost: 10,
        item: mockItem,
      },
    ],
  };

  const mockPrismaService: any = {
    vendor: {
      findFirst: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    vendorItem: {
      findUnique: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrderLine: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    goodsReceivedNote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    goodsReceivedNoteLine: {
      create: jest.fn(),
    },
    stockLevel: {
      upsert: jest.fn(),
      findFirst: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Set up $transaction mock to call the callback with mockPrismaService
  mockPrismaService.$transaction.mockImplementation((callback: any) => {
    if (typeof callback === 'function') {
      return callback(mockPrismaService);
    }
    return Promise.all(callback);
  });

  const mockOrganizationsService = {
    getNextNumber: jest.fn().mockResolvedValue('PO-0001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a purchase order successfully', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue({ unitCost: 10 });
      mockPrismaService.purchaseOrder.create.mockResolvedValue(mockPurchaseOrder);

      const result = await service.create('org1', {
        vendorId: 'vendor1',
        lines: [{ itemId: 'item1', quantity: 10 }],
      });

      expect(result.poNumber).toBe('PO-0001');
      expect(result.status).toBe('DRAFT');
      expect(mockPrismaService.purchaseOrder.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          vendorId: 'nonexistent',
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no warehouse specified and none is primary', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          vendorId: 'vendor1',
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use provided PO number when given', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue({ unitCost: 10 });
      mockPrismaService.purchaseOrder.create.mockResolvedValue({
        ...mockPurchaseOrder,
        orderNumber: 'CUSTOM-PO-001',
      });

      const result = await service.create('org1', {
        vendorId: 'vendor1',
        poNumber: 'CUSTOM-PO-001',
        lines: [{ itemId: 'item1', quantity: 10 }],
      });

      expect(result.poNumber).toBe('CUSTOM-PO-001');
    });
  });

  describe('findAll', () => {
    it('should return paginated purchase orders', async () => {
      mockPrismaService.purchaseOrder.findMany.mockResolvedValue([mockPurchaseOrder]);
      mockPrismaService.purchaseOrder.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.purchaseOrder.findMany.mockResolvedValue([]);
      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);

      await service.findAll('org1', { status: 'ISSUED' });

      expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ISSUED' }),
        }),
      );
    });

    it('should filter by vendor', async () => {
      mockPrismaService.purchaseOrder.findMany.mockResolvedValue([]);
      mockPrismaService.purchaseOrder.count.mockResolvedValue(0);

      await service.findAll('org1', { vendorId: 'vendor1' });

      expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ vendorId: 'vendor1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a purchase order by ID', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(mockPurchaseOrder);

      const result = await service.findOne('org1', 'po1');

      expect(result.id).toBe('po1');
      expect(result.poNumber).toBe('PO-0001');
    });

    it('should throw NotFoundException when PO not found', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a draft purchase order', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(mockPurchaseOrder);
      mockPrismaService.purchaseOrder.update.mockResolvedValue({
        ...mockPurchaseOrder,
        notes: 'Updated notes',
      });

      const result = await service.update('org1', 'po1', { notes: 'Updated notes' });

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw NotFoundException when PO not found', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'nonexistent', { notes: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to update non-draft PO', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue({
        ...mockPurchaseOrder,
        status: 'ISSUED',
      });

      await expect(
        service.update('org1', 'po1', { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('send', () => {
    it('should send a draft purchase order', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(mockPurchaseOrder);
      mockPrismaService.purchaseOrderLine.findMany.mockResolvedValue(mockPurchaseOrder.lines);
      mockPrismaService.item.update.mockResolvedValue(mockItem);
      mockPrismaService.purchaseOrder.update.mockResolvedValue({
        ...mockPurchaseOrder,
        status: 'ISSUED',
      });

      const result = await service.send('org1', 'po1');

      expect(result.status).toBe('ISSUED');
    });

    it('should throw BadRequestException when PO is not draft', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue({
        ...mockPurchaseOrder,
        status: 'ISSUED',
      });

      await expect(service.send('org1', 'po1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a purchase order', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(mockPurchaseOrder);
      mockPrismaService.purchaseOrder.update.mockResolvedValue({
        ...mockPurchaseOrder,
        status: 'CANCELLED',
      });

      const result = await service.cancel('org1', 'po1');

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw BadRequestException when trying to cancel received PO', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue({
        ...mockPurchaseOrder,
        status: 'RECEIVED',
      });

      await expect(service.cancel('org1', 'po1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('createGRN', () => {
    it('should create a GRN from a purchase order', async () => {
      const issuedPO = { ...mockPurchaseOrder, status: 'ISSUED' };
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(issuedPO);
      mockOrganizationsService.getNextNumber.mockResolvedValue('GRN-0001');
      mockPrismaService.goodsReceivedNote.create.mockResolvedValue(mockGRN);
      mockPrismaService.purchaseOrderLine.findFirst.mockResolvedValue(mockPurchaseOrder.lines[0]);
      mockPrismaService.purchaseOrderLine.findMany.mockResolvedValue([
        { ...mockPurchaseOrder.lines[0], quantityReceived: 10 },
      ]);
      mockPrismaService.purchaseOrderLine.update.mockResolvedValue(mockPurchaseOrder.lines[0]);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(null);
      mockPrismaService.stockLevel.upsert.mockResolvedValue({});
      mockPrismaService.stockMovement.create.mockResolvedValue({});
      mockPrismaService.purchaseOrder.update.mockResolvedValue(issuedPO);

      const result = await service.createGRN('org1', 'po1', {
        lines: [{ poLineId: 'line1', quantityReceived: 10 }],
      });

      expect(result.grnNumber).toBe('GRN-0001');
    });

    it('should throw NotFoundException when PO not found', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.createGRN('org1', 'nonexistent', {
          lines: [{ poLineId: 'line1', quantityReceived: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when PO is not issued', async () => {
      mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(mockPurchaseOrder);

      await expect(
        service.createGRN('org1', 'po1', {
          lines: [{ poLineId: 'line1', quantityReceived: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllGRNs', () => {
    it('should return paginated GRNs', async () => {
      mockPrismaService.goodsReceivedNote.findMany.mockResolvedValue([mockGRN]);
      mockPrismaService.goodsReceivedNote.count.mockResolvedValue(1);

      const result = await service.findAllGRNs('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter GRNs by vendor', async () => {
      mockPrismaService.goodsReceivedNote.findMany.mockResolvedValue([]);
      mockPrismaService.goodsReceivedNote.count.mockResolvedValue(0);

      await service.findAllGRNs('org1', { vendorId: 'vendor1' });

      expect(mockPrismaService.goodsReceivedNote.findMany).toHaveBeenCalled();
    });
  });

  describe('findOneGRN', () => {
    it('should return a GRN by ID', async () => {
      mockPrismaService.goodsReceivedNote.findFirst.mockResolvedValue(mockGRN);

      const result = await service.findOneGRN('org1', 'grn1');

      expect(result.id).toBe('grn1');
      expect(result.grnNumber).toBe('GRN-0001');
    });

    it('should throw NotFoundException when GRN not found', async () => {
      mockPrismaService.goodsReceivedNote.findFirst.mockResolvedValue(null);

      await expect(service.findOneGRN('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReorderSuggestions', () => {
    it('should return items that need reordering', async () => {
      const lowStockItem = {
        ...mockItem,
        stockLevels: [{ warehouseId: 'wh1', quantity: 5 }],
        reorderPoint: 10,
        reorderQty: 50,
      };
      mockPrismaService.item.findMany.mockResolvedValue([lowStockItem]);

      const result = await service.getReorderSuggestions('org1');

      expect(result).toBeDefined();
    });
  });
});

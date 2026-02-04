import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';
import { AdjustmentType } from './dto';

describe('InventoryService', () => {
  let service: InventoryService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockWarehouse = {
    id: 'wh1',
    organizationId: 'org1',
    code: 'WH-001',
    name: 'Main Warehouse',
    deletedAt: null,
  };

  const mockItem = {
    id: 'item1',
    organizationId: 'org1',
    code: 'ITEM001',
    name: 'Test Item',
    deletedAt: null,
  };

  const mockStockLevel = {
    id: 'sl1',
    itemId: 'item1',
    warehouseId: 'wh1',
    binLocationId: null,
    onHand: 100,
    committed: 20,
    onOrder: 50,
  };

  const mockAdjustment = {
    id: 'adj1',
    organizationId: 'org1',
    adjustmentNo: 'ADJ-0001',
    warehouseId: 'wh1',
    warehouse: mockWarehouse,
    type: 'WRITE_IN',
    adjustmentDate: new Date(),
    reason: 'Test adjustment',
    status: 'DRAFT',
    createdAt: new Date(),
    lines: [
      {
        id: 'adjline1',
        itemId: 'item1',
        item: mockItem,
        quantity: 10,
        unitCost: 0,
        binLocationId: null,
        notes: 'Test line',
      },
    ],
  };

  const mockTransfer = {
    id: 'trf1',
    organizationId: 'org1',
    transferNo: 'TRF-0001',
    fromWarehouseId: 'wh1',
    fromWarehouse: { ...mockWarehouse, name: 'Source Warehouse' },
    toWarehouseId: 'wh2',
    toWarehouse: { ...mockWarehouse, id: 'wh2', name: 'Destination Warehouse' },
    transferDate: new Date(),
    status: 'DRAFT',
    notes: 'Test transfer',
    createdAt: new Date(),
    lines: [
      {
        id: 'trfline1',
        itemId: 'item1',
        item: mockItem,
        quantity: 10,
      },
    ],
  };

  const mockStockCount = {
    id: 'cnt1',
    organizationId: 'org1',
    countNo: 'CNT-0001',
    warehouseId: 'wh1',
    warehouse: mockWarehouse,
    countDate: new Date(),
    status: 'IN_PROGRESS',
    notes: 'Test count',
    createdAt: new Date(),
    lines: [
      {
        id: 'cntline1',
        itemId: 'item1',
        item: mockItem,
        systemQty: 100,
        countedQty: null,
      },
    ],
  };

  const mockOrganizationsService = {
    getNextNumber: jest.fn(),
  };

  const mockPrismaService: any = {
    warehouse: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    stockLevel: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    stockAdjustment: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    stockTransfer: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    stockCount: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    stockCountLine: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrismaService);
      }
      return Promise.all(callback);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAdjustment', () => {
    it('should create a stock adjustment', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockOrganizationsService.getNextNumber.mockResolvedValue('ADJ-0001');
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.stockAdjustment.create.mockResolvedValue(mockAdjustment);

      const result = await service.createAdjustment('org1', {
        warehouseId: 'wh1',
        adjustmentType: AdjustmentType.ADD,
        reason: 'Test adjustment',
        lines: [{ itemId: 'item1', quantity: 10 }],
      });

      expect(result.adjustmentNumber).toBe('ADJ-0001');
      expect(mockPrismaService.stockAdjustment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.createAdjustment('org1', {
          warehouseId: 'nonexistent',
          adjustmentType: AdjustmentType.ADD,
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockOrganizationsService.getNextNumber.mockResolvedValue('ADJ-0001');
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.createAdjustment('org1', {
          warehouseId: 'wh1',
          adjustmentType: AdjustmentType.ADD,
          lines: [{ itemId: 'nonexistent', quantity: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for damage adjustment with insufficient stock', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockOrganizationsService.getNextNumber.mockResolvedValue('ADJ-0001');
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue({
        ...mockStockLevel,
        onHand: 5,
      });

      await expect(
        service.createAdjustment('org1', {
          warehouseId: 'wh1',
          adjustmentType: AdjustmentType.DAMAGE,
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmAdjustment', () => {
    it('should confirm a stock adjustment', async () => {
      mockPrismaService.stockAdjustment.findFirst.mockResolvedValue(mockAdjustment);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(mockStockLevel);
      mockPrismaService.stockLevel.update.mockResolvedValue({});
      mockPrismaService.stockMovement.create.mockResolvedValue({});
      mockPrismaService.stockAdjustment.update.mockResolvedValue({
        ...mockAdjustment,
        status: 'CONFIRMED',
      });

      const result = await service.confirmAdjustment('org1', 'adj1');

      expect(result.status).toBe('CONFIRMED');
    });

    it('should throw NotFoundException when adjustment not found', async () => {
      mockPrismaService.stockAdjustment.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmAdjustment('org1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already confirmed', async () => {
      mockPrismaService.stockAdjustment.findFirst.mockResolvedValue({
        ...mockAdjustment,
        status: 'CONFIRMED',
      });

      await expect(
        service.confirmAdjustment('org1', 'adj1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create stock level if not exists', async () => {
      mockPrismaService.stockAdjustment.findFirst.mockResolvedValue(mockAdjustment);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(null);
      mockPrismaService.stockLevel.create.mockResolvedValue({});
      mockPrismaService.stockMovement.create.mockResolvedValue({});
      mockPrismaService.stockAdjustment.update.mockResolvedValue({
        ...mockAdjustment,
        status: 'CONFIRMED',
      });

      await service.confirmAdjustment('org1', 'adj1');

      expect(mockPrismaService.stockLevel.create).toHaveBeenCalled();
    });
  });

  describe('findAllAdjustments', () => {
    it('should return paginated adjustments', async () => {
      mockPrismaService.stockAdjustment.findMany.mockResolvedValue([mockAdjustment]);
      mockPrismaService.stockAdjustment.count.mockResolvedValue(1);

      const result = await service.findAllAdjustments('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by warehouseId', async () => {
      mockPrismaService.stockAdjustment.findMany.mockResolvedValue([]);
      mockPrismaService.stockAdjustment.count.mockResolvedValue(0);

      await service.findAllAdjustments('org1', { warehouseId: 'wh1' });

      expect(mockPrismaService.stockAdjustment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ warehouseId: 'wh1' }),
        }),
      );
    });
  });

  describe('createTransfer', () => {
    it('should create a stock transfer', async () => {
      mockPrismaService.warehouse.findFirst
        .mockResolvedValueOnce(mockWarehouse)
        .mockResolvedValueOnce({ ...mockWarehouse, id: 'wh2' });
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(mockStockLevel);
      mockOrganizationsService.getNextNumber.mockResolvedValue('TRF-0001');
      mockPrismaService.stockTransfer.create.mockResolvedValue(mockTransfer);

      const result = await service.createTransfer('org1', {
        fromWarehouseId: 'wh1',
        toWarehouseId: 'wh2',
        lines: [{ itemId: 'item1', quantity: 10 }],
      });

      expect(result.transferNumber).toBe('TRF-0001');
    });

    it('should throw BadRequestException when source and destination are same', async () => {
      await expect(
        service.createTransfer('org1', {
          fromWarehouseId: 'wh1',
          toWarehouseId: 'wh1',
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when source warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.createTransfer('org1', {
          fromWarehouseId: 'nonexistent',
          toWarehouseId: 'wh2',
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      mockPrismaService.warehouse.findFirst
        .mockResolvedValueOnce(mockWarehouse)
        .mockResolvedValueOnce({ ...mockWarehouse, id: 'wh2' });
      mockPrismaService.stockLevel.findFirst.mockResolvedValue({
        ...mockStockLevel,
        onHand: 5,
        committed: 0,
      });

      await expect(
        service.createTransfer('org1', {
          fromWarehouseId: 'wh1',
          toWarehouseId: 'wh2',
          lines: [{ itemId: 'item1', quantity: 10 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirmTransfer', () => {
    it('should confirm a stock transfer', async () => {
      mockPrismaService.stockTransfer.findFirst.mockResolvedValue(mockTransfer);
      mockPrismaService.stockLevel.findFirst
        .mockResolvedValueOnce(mockStockLevel)
        .mockResolvedValueOnce(null);
      mockPrismaService.stockLevel.update.mockResolvedValue({});
      mockPrismaService.stockLevel.create.mockResolvedValue({});
      mockPrismaService.stockMovement.createMany.mockResolvedValue({});
      mockPrismaService.stockTransfer.update.mockResolvedValue({
        ...mockTransfer,
        status: 'COMPLETED',
      });

      const result = await service.confirmTransfer('org1', 'trf1');

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException when transfer not found', async () => {
      mockPrismaService.stockTransfer.findFirst.mockResolvedValue(null);

      await expect(
        service.confirmTransfer('org1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when already processed', async () => {
      mockPrismaService.stockTransfer.findFirst.mockResolvedValue({
        ...mockTransfer,
        status: 'COMPLETED',
      });

      await expect(
        service.confirmTransfer('org1', 'trf1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createStockCount', () => {
    it('should create a stock count', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockOrganizationsService.getNextNumber.mockResolvedValue('CNT-0001');
      mockPrismaService.stockLevel.findMany.mockResolvedValue([{
        ...mockStockLevel,
        item: mockItem,
      }]);
      mockPrismaService.stockCount.create.mockResolvedValue(mockStockCount);

      const result = await service.createStockCount('org1', {
        warehouseId: 'wh1',
      });

      expect(result.countNumber).toBe('CNT-0001');
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.createStockCount('org1', { warehouseId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no items to count', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockOrganizationsService.getNextNumber.mockResolvedValue('CNT-0001');
      mockPrismaService.stockLevel.findMany.mockResolvedValue([]);

      await expect(
        service.createStockCount('org1', { warehouseId: 'wh1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneStockCount', () => {
    it('should return a stock count by ID', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(mockStockCount);

      const result = await service.findOneStockCount('org1', 'cnt1');

      expect(result.id).toBe('cnt1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(null);

      await expect(
        service.findOneStockCount('org1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordCount', () => {
    it('should record count quantities', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(mockStockCount);
      mockPrismaService.stockCountLine.update.mockResolvedValue({});
      mockPrismaService.stockCount.findUnique.mockResolvedValue({
        ...mockStockCount,
        lines: [{ ...mockStockCount.lines[0], countedQty: 95 }],
      });

      const result = await service.recordCount('org1', 'cnt1', [
        { lineId: 'cntline1', countedQty: 95 },
      ]);

      expect(result.lines[0].countedQty).toBe(95);
    });

    it('should throw NotFoundException when count not found', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(null);

      await expect(
        service.recordCount('org1', 'nonexistent', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when not in progress', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue({
        ...mockStockCount,
        status: 'COMPLETED',
      });

      await expect(
        service.recordCount('org1', 'cnt1', []),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeStockCount', () => {
    it('should complete a stock count', async () => {
      const completedCount = {
        ...mockStockCount,
        lines: [{ ...mockStockCount.lines[0], countedQty: 95 }],
      };
      mockPrismaService.stockCount.findFirst.mockResolvedValue(completedCount);
      mockOrganizationsService.getNextNumber.mockResolvedValue('ADJ-0002');
      mockPrismaService.stockAdjustment.create.mockResolvedValue({});
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(mockStockLevel);
      mockPrismaService.stockLevel.update.mockResolvedValue({});
      mockPrismaService.stockMovement.create.mockResolvedValue({});
      mockPrismaService.stockCount.update.mockResolvedValue({
        ...completedCount,
        status: 'COMPLETED',
      });

      const result = await service.completeStockCount('org1', 'cnt1', true);

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException when count not found', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(null);

      await expect(
        service.completeStockCount('org1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when not all items counted', async () => {
      mockPrismaService.stockCount.findFirst.mockResolvedValue(mockStockCount);

      await expect(
        service.completeStockCount('org1', 'cnt1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllStockCounts', () => {
    it('should return paginated stock counts', async () => {
      mockPrismaService.stockCount.findMany.mockResolvedValue([mockStockCount]);
      mockPrismaService.stockCount.count.mockResolvedValue(1);

      const result = await service.findAllStockCounts('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getStockMovements', () => {
    it('should return paginated stock movements', async () => {
      const mockMovement = {
        id: 'mov1',
        itemId: 'item1',
        item: mockItem,
        warehouseId: 'wh1',
        warehouse: mockWarehouse,
        movementType: 'ADJUSTMENT',
        quantity: 10,
        referenceType: 'ADJUSTMENT',
        referenceId: 'adj1',
        createdAt: new Date(),
      };

      mockPrismaService.warehouse.findMany.mockResolvedValue([{ id: 'wh1' }]);
      mockPrismaService.stockMovement.findMany.mockResolvedValue([mockMovement]);
      mockPrismaService.stockMovement.count.mockResolvedValue(1);

      const result = await service.getStockMovements('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by itemId', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValue([{ id: 'wh1' }]);
      mockPrismaService.stockMovement.findMany.mockResolvedValue([]);
      mockPrismaService.stockMovement.count.mockResolvedValue(0);

      await service.getStockMovements('org1', { itemId: 'item1' });

      expect(mockPrismaService.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ itemId: 'item1' }),
        }),
      );
    });
  });
});

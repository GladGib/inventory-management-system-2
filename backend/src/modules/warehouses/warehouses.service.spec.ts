import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { PrismaService } from '@/common/prisma';

describe('WarehousesService', () => {
  let service: WarehousesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockWarehouse = {
    id: 'wh1',
    organizationId: 'org1',
    code: 'WH-001',
    name: 'Main Warehouse',
    address: '123 Warehouse St',
    phone: '0123456789',
    isPrimary: true,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBinLocation = {
    id: 'bin1',
    warehouseId: 'wh1',
    code: 'A1-01',
    zone: 'Zone A',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService: any = {
    warehouse: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    binLocation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stockLevel: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
        WarehousesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a warehouse successfully', async () => {
      mockPrismaService.warehouse.findUnique.mockResolvedValue(null);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);
      mockPrismaService.warehouse.create.mockResolvedValue(mockWarehouse);

      const result = await service.create('org1', {
        name: 'Main Warehouse',
        address: '123 Warehouse St',
      });

      expect(result.name).toBe('Main Warehouse');
      expect(mockPrismaService.warehouse.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when code already exists', async () => {
      mockPrismaService.warehouse.findUnique.mockResolvedValue(mockWarehouse);

      await expect(
        service.create('org1', {
          code: 'WH-001',
          name: 'Test Warehouse',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should unset other primary warehouses when creating primary warehouse', async () => {
      mockPrismaService.warehouse.findUnique.mockResolvedValue(null);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);
      mockPrismaService.warehouse.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.warehouse.create.mockResolvedValue({
        ...mockWarehouse,
        isPrimary: true,
      });

      await service.create('org1', {
        name: 'New Primary Warehouse',
        isPrimary: true,
      });

      expect(mockPrismaService.warehouse.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1', isPrimary: true },
        data: { isPrimary: false },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated warehouses', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValue([mockWarehouse]);
      mockPrismaService.warehouse.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValue([]);
      mockPrismaService.warehouse.count.mockResolvedValue(0);

      await service.findAll('org1', { search: 'main' });

      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValue([]);
      mockPrismaService.warehouse.count.mockResolvedValue(0);

      await service.findAll('org1', { isActive: true });

      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a warehouse by ID', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);

      const result = await service.findOne('org1', 'wh1');

      expect(result.id).toBe('wh1');
      expect(result.name).toBe('Main Warehouse');
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a warehouse successfully', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.warehouse.update.mockResolvedValue({
        ...mockWarehouse,
        name: 'Updated Warehouse',
      });

      const result = await service.update('org1', 'wh1', { name: 'Updated Warehouse' });

      expect(result.name).toBe('Updated Warehouse');
    });

    it('should throw NotFoundException when updating non-existent warehouse', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating to duplicate code', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.warehouse.findUnique.mockResolvedValue({
        ...mockWarehouse,
        id: 'wh2',
        code: 'WH-002',
      });

      await expect(
        service.update('org1', 'wh1', { code: 'WH-002' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a warehouse', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.count.mockResolvedValue(0);
      mockPrismaService.warehouse.update.mockResolvedValue({
        ...mockWarehouse,
        deletedAt: new Date(),
        isActive: false,
      });

      await service.remove('org1', 'wh1');

      expect(mockPrismaService.warehouse.update).toHaveBeenCalledWith({
        where: { id: 'wh1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });

    it('should throw NotFoundException when removing non-existent warehouse', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.remove('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when warehouse has stock', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.count.mockResolvedValue(5);

      await expect(service.remove('org1', 'wh1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('setPrimary', () => {
    it('should set warehouse as primary', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue({
        ...mockWarehouse,
        isPrimary: false,
      });
      mockPrismaService.warehouse.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.warehouse.update.mockResolvedValue({
        ...mockWarehouse,
        isPrimary: true,
      });

      const result = await service.setPrimary('org1', 'wh1');

      expect(result.isPrimary).toBe(true);
      expect(mockPrismaService.warehouse.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.setPrimary('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createBinLocation', () => {
    it('should create a bin location', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findUnique.mockResolvedValue(null);
      mockPrismaService.binLocation.create.mockResolvedValue(mockBinLocation);

      const result = await service.createBinLocation('org1', 'wh1', {
        code: 'A1-01',
      });

      expect(result.code).toBe('A1-01');
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.createBinLocation('org1', 'nonexistent', { code: 'A1-01' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when bin code already exists', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findUnique.mockResolvedValue(mockBinLocation);

      await expect(
        service.createBinLocation('org1', 'wh1', { code: 'A1-01' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllBinLocations', () => {
    it('should return paginated bin locations', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findMany.mockResolvedValue([mockBinLocation]);
      mockPrismaService.binLocation.count.mockResolvedValue(1);

      const result = await service.findAllBinLocations('org1', 'wh1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllBinLocations('org1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateBinLocation', () => {
    it('should update a bin location', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findFirst.mockResolvedValue(mockBinLocation);
      mockPrismaService.binLocation.findUnique.mockResolvedValue(null);
      mockPrismaService.binLocation.update.mockResolvedValue({
        ...mockBinLocation,
        code: 'A1-02',
      });

      const result = await service.updateBinLocation('org1', 'wh1', 'bin1', { code: 'A1-02' });

      expect(result.code).toBe('A1-02');
    });

    it('should throw NotFoundException when bin location not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findFirst.mockResolvedValue(null);

      await expect(
        service.updateBinLocation('org1', 'wh1', 'nonexistent', { code: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeBinLocation', () => {
    it('should delete a bin location', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findFirst.mockResolvedValue(mockBinLocation);
      mockPrismaService.stockLevel.count.mockResolvedValue(0);
      mockPrismaService.binLocation.delete.mockResolvedValue(mockBinLocation);

      await service.removeBinLocation('org1', 'wh1', 'bin1');

      expect(mockPrismaService.binLocation.delete).toHaveBeenCalledWith({
        where: { id: 'bin1' },
      });
    });

    it('should throw BadRequestException when bin has stock', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.binLocation.findFirst.mockResolvedValue(mockBinLocation);
      mockPrismaService.stockLevel.count.mockResolvedValue(5);

      await expect(
        service.removeBinLocation('org1', 'wh1', 'bin1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStockSummary', () => {
    it('should return stock summary for warehouse', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.findMany.mockResolvedValue([
        {
          onHand: 100,
          committed: 20,
          onOrder: 50,
          item: { reorderPoint: 30 },
        },
        {
          onHand: 50,
          committed: 10,
          onOrder: 0,
          item: { reorderPoint: 60 },
        },
      ]);

      const result = await service.getStockSummary('org1', 'wh1');

      expect(result.warehouseId).toBe('wh1');
      expect(result.totalItems).toBe(2);
      expect(result.totalOnHand).toBe(150);
      expect(result.totalCommitted).toBe(30);
      expect(result.lowStockItems).toBe(1);
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.getStockSummary('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStockLevels', () => {
    it('should return paginated stock levels', async () => {
      const mockStockLevel = {
        itemId: 'item1',
        warehouseId: 'wh1',
        binLocationId: null,
        onHand: 100,
        committed: 20,
        onOrder: 50,
        item: {
          id: 'item1',
          code: 'ITEM001',
          name: 'Test Item',
          reorderPoint: 30,
        },
        warehouse: mockWarehouse,
        binLocation: null,
      };

      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.findMany.mockResolvedValue([mockStockLevel]);
      mockPrismaService.stockLevel.count.mockResolvedValue(1);

      const result = await service.getStockLevels('org1', 'wh1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].itemCode).toBe('ITEM001');
    });

    it('should throw NotFoundException when warehouse not found', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(null);

      await expect(service.getStockLevels('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getItemStockByWarehouse', () => {
    it('should return stock level for specific item', async () => {
      const mockStockLevel = {
        itemId: 'item1',
        warehouseId: 'wh1',
        binLocationId: null,
        onHand: 100,
        committed: 20,
        onOrder: 50,
        item: {
          id: 'item1',
          code: 'ITEM001',
          name: 'Test Item',
          reorderPoint: 30,
        },
        warehouse: mockWarehouse,
        binLocation: null,
      };

      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(mockStockLevel);

      const result = await service.getItemStockByWarehouse('org1', 'wh1', 'item1');

      expect(result?.itemId).toBe('item1');
      expect(result?.onHand).toBe(100);
    });

    it('should return null when no stock level exists', async () => {
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(null);

      const result = await service.getItemStockByWarehouse('org1', 'wh1', 'item1');

      expect(result).toBeNull();
    });
  });
});

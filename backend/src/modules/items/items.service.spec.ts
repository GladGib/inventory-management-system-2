import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ItemsService } from './items.service';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: PrismaService;

  const mockItem = {
    id: 'item1',
    organizationId: 'org1',
    code: 'ITEM001',
    name: 'Test Item',
    description: 'A test item',
    type: 'SIMPLE',
    uom: 'pcs',
    barcode: '1234567890',
    costPrice: 10,
    sellingPrice: 15,
    trackInventory: true,
    isActive: true,
    deletedAt: null,
    category: { id: 'cat1', name: 'Category 1' },
    taxRate: { id: 'tax1', name: 'GST', rate: 6 },
    stockLevels: [],
  };

  const mockPrismaService = {
    item: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    category: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    stockLevel: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  const mockOrganizationsService = {
    getNextNumber: jest.fn().mockResolvedValue('ITEM001'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an item successfully', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findFirst.mockResolvedValue(null);
      mockPrismaService.item.create.mockResolvedValue(mockItem);

      const result = await service.create('org1', {
        name: 'Test Item',
        sellingPrice: 15,
        uom: 'pcs',
      });

      expect(result.code).toBe('ITEM001');
      expect(result.name).toBe('Test Item');
      expect(mockPrismaService.item.create).toHaveBeenCalled();
    });

    it('should use provided code when given', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.item.create.mockResolvedValue({
        ...mockItem,
        code: 'CUSTOM001',
      });

      const result = await service.create('org1', {
        code: 'CUSTOM001',
        name: 'Test Item',
        sellingPrice: 15,
        uom: 'pcs',
      });

      expect(result.code).toBe('CUSTOM001');
    });

    it('should throw BadRequestException when code already exists', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(mockItem);

      await expect(
        service.create('org1', {
          code: 'ITEM001',
          name: 'Test Item',
          sellingPrice: 15,
          uom: 'pcs',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when barcode already exists', async () => {
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.create('org1', {
          name: 'Test Item',
          barcode: '1234567890',
          sellingPrice: 15,
          uom: 'pcs',
        }),
      ).rejects.toThrow('Barcode already assigned to another item');
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await service.findAll('org1', { search: 'test' });

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
            ]),
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await service.findAll('org1', { categoryId: 'cat1' });

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat1',
          }),
        }),
      );
    });

    it('should filter by active status', async () => {
      mockPrismaService.item.findMany.mockResolvedValue([mockItem]);
      mockPrismaService.item.count.mockResolvedValue(1);

      await service.findAll('org1', { isActive: true });

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return item when found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);

      const result = await service.findOne('org1', 'item1');

      expect(result.id).toBe('item1');
      expect(result.code).toBe('ITEM001');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update item successfully', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.item.findUnique.mockResolvedValue(null);
      mockPrismaService.item.update.mockResolvedValue({
        ...mockItem,
        name: 'Updated Item',
      });

      const result = await service.update('org1', 'item1', {
        name: 'Updated Item',
      });

      expect(result.name).toBe('Updated Item');
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'invalid', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when new barcode already exists', async () => {
      mockPrismaService.item.findFirst
        .mockResolvedValueOnce(mockItem) // First call to find the item being updated
        .mockResolvedValueOnce({ ...mockItem, id: 'item2' }); // Second call finds existing item with that barcode

      await expect(
        service.update('org1', 'item1', { barcode: 'EXISTING-BARCODE' }),
      ).rejects.toThrow('Barcode already assigned to another item');
    });
  });

  describe('remove', () => {
    it('should soft delete item successfully', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.item.update.mockResolvedValue({
        ...mockItem,
        deletedAt: new Date(),
      });

      await service.remove('org1', 'item1');

      expect(mockPrismaService.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item1' },
          data: { deletedAt: expect.any(Date), isActive: false },
        }),
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(service.remove('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStock', () => {
    it('should return item with stock levels', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.stockLevel.findMany.mockResolvedValue([
        {
          id: 'sl1',
          warehouseId: 'wh1',
          warehouse: { id: 'wh1', name: 'Warehouse 1' },
          onHand: 100,
          committed: 20,
          onOrder: 50,
        },
      ]);

      const result = await service.getStock('org1', 'item1');

      expect(result.itemId).toBe('item1');
      expect(result.byWarehouse).toHaveLength(1);
      expect(result.byWarehouse[0].onHand).toBe(100);
      expect(result.byWarehouse[0].available).toBe(80); // 100 - 20
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(service.getStock('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByBarcode', () => {
    it('should return item when barcode found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);

      const result = await service.findByBarcode('org1', '1234567890');

      expect(result.barcode).toBe('1234567890');
    });

    it('should throw NotFoundException when barcode not found', async () => {
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.findByBarcode('org1', 'invalid-barcode'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

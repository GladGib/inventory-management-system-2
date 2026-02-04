import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { PrismaService } from '@/common/prisma';

describe('VendorsService', () => {
  let service: VendorsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockVendor = {
    id: 'vend1',
    organizationId: 'org1',
    code: 'VEND-00001',
    companyName: 'Test Vendor',
    contactPerson: 'John Doe',
    phone: '0123456789',
    email: 'vendor@test.com',
    taxRegistrationNo: 'TAX123',
    paymentTerms: 'Net 30',
    notes: 'Test notes',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    addresses: [],
    contacts: [],
  };

  const mockPrismaService: any = {
    vendor: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    vendorAddress: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    vendorContact: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    vendorItem: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
    },
    purchaseBill: {
      findMany: jest.fn(),
    },
    paymentMade: {
      findMany: jest.fn(),
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
        VendorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vendor successfully', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);
      mockPrismaService.vendor.create.mockResolvedValue(mockVendor);

      const result = await service.create('org1', {
        name: 'Test Vendor',
        email: 'vendor@test.com',
      });

      expect(result.code).toBe('VEND-00001');
      expect(result.name).toBe('Test Vendor');
      expect(mockPrismaService.vendor.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when code already exists', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(mockVendor);

      await expect(
        service.create('org1', {
          code: 'VEND-00001',
          name: 'Test Vendor',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use provided code when given', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);
      mockPrismaService.vendor.create.mockResolvedValue({
        ...mockVendor,
        code: 'CUSTOM001',
      });

      const result = await service.create('org1', {
        code: 'CUSTOM001',
        name: 'Test Vendor',
      });

      expect(result.code).toBe('CUSTOM001');
    });

    it('should create vendor with addresses', async () => {
      mockPrismaService.vendor.findUnique.mockResolvedValue(null);
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);
      mockPrismaService.vendor.create.mockResolvedValue({
        ...mockVendor,
        addresses: [{
          id: 'addr1',
          label: 'Main Office',
          addressLine1: '123 Test St',
          city: 'Kuala Lumpur',
          state: 'WP',
          postalCode: '50000',
          country: 'Malaysia',
          isDefault: true,
        }],
      });

      const result = await service.create('org1', {
        name: 'Test Vendor',
        addresses: [{
          label: 'Main Office',
          addressLine1: '123 Test St',
          city: 'Kuala Lumpur',
          state: 'WP',
          postalCode: '50000',
        }],
      });

      expect(result.addresses).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated vendors', async () => {
      mockPrismaService.vendor.findMany.mockResolvedValue([mockVendor]);
      mockPrismaService.vendor.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.vendor.findMany.mockResolvedValue([]);
      mockPrismaService.vendor.count.mockResolvedValue(0);

      await service.findAll('org1', { search: 'test' });

      expect(mockPrismaService.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      mockPrismaService.vendor.findMany.mockResolvedValue([]);
      mockPrismaService.vendor.count.mockResolvedValue(0);

      await service.findAll('org1', { isActive: true });

      expect(mockPrismaService.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a vendor by ID', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);

      const result = await service.findOne('org1', 'vend1');

      expect(result.id).toBe('vend1');
      expect(result.code).toBe('VEND-00001');
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a vendor by code', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);

      const result = await service.findByCode('org1', 'VEND-00001');

      expect(result.code).toBe('VEND-00001');
    });

    it('should throw NotFoundException when vendor not found by code', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(service.findByCode('org1', 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a vendor successfully', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendor.update.mockResolvedValue({
        ...mockVendor,
        companyName: 'Updated Vendor',
      });

      const result = await service.update('org1', 'vend1', { name: 'Updated Vendor' });

      expect(result.name).toBe('Updated Vendor');
    });

    it('should throw NotFoundException when updating non-existent vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendor.update.mockResolvedValue({
        ...mockVendor,
        deletedAt: new Date(),
        isActive: false,
      });

      await service.remove('org1', 'vend1');

      expect(mockPrismaService.vendor.update).toHaveBeenCalledWith({
        where: { id: 'vend1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });

    it('should throw NotFoundException when removing non-existent vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(service.remove('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAddress', () => {
    it('should add an address to a vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorAddress.create.mockResolvedValue({
        id: 'addr1',
        vendorId: 'vend1',
        label: 'Branch Office',
        addressLine1: '456 New St',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
        country: 'Malaysia',
        isDefault: false,
      });

      const result = await service.addAddress('org1', 'vend1', {
        label: 'Branch Office',
        addressLine1: '456 New St',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
      });

      expect(result.label).toBe('Branch Office');
    });

    it('should unset other default addresses when adding default address', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorAddress.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.vendorAddress.create.mockResolvedValue({
        id: 'addr1',
        label: 'New Default',
        isDefault: true,
      });

      await service.addAddress('org1', 'vend1', {
        label: 'New Default',
        addressLine1: '123 St',
        city: 'KL',
        state: 'WP',
        postalCode: '50000',
        isDefault: true,
      });

      expect(mockPrismaService.vendorAddress.updateMany).toHaveBeenCalled();
    });
  });

  describe('addContact', () => {
    it('should add a contact to a vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorContact.create.mockResolvedValue({
        id: 'contact1',
        vendorId: 'vend1',
        name: 'Jane Doe',
        role: 'Sales Manager',
        phone: '0129876543',
        email: 'jane@test.com',
        isPrimary: false,
      });

      const result = await service.addContact('org1', 'vend1', {
        name: 'Jane Doe',
        designation: 'Sales Manager',
        phone: '0129876543',
        email: 'jane@test.com',
      });

      expect(result.name).toBe('Jane Doe');
    });
  });

  describe('linkItem', () => {
    const mockItem = {
      id: 'item1',
      organizationId: 'org1',
      code: 'ITEM001',
      name: 'Test Item',
      deletedAt: null,
    };

    it('should link an item to a vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue(null);
      mockPrismaService.vendorItem.create.mockResolvedValue({
        id: 'vi1',
        vendorId: 'vend1',
        itemId: 'item1',
        vendorSku: 'VSKU001',
        price: 100,
        leadTimeDays: 7,
        isPreferred: true,
        item: mockItem,
      });

      const result = await service.linkItem('org1', 'vend1', {
        itemId: 'item1',
        vendorPartNumber: 'VSKU001',
        unitCost: 100,
        leadTimeDays: 7,
        isPreferred: true,
      });

      expect(result.itemId).toBe('item1');
      expect(result.vendorPartNumber).toBe('VSKU001');
    });

    it('should throw BadRequestException when item already linked', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.item.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue({ id: 'vi1' });

      await expect(
        service.linkItem('org1', 'vend1', {
          itemId: 'item1',
          unitCost: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.linkItem('org1', 'vend1', {
          itemId: 'nonexistent',
          unitCost: 100,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlinkItem', () => {
    it('should unlink an item from a vendor', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue({ id: 'vi1' });
      mockPrismaService.vendorItem.delete.mockResolvedValue({ id: 'vi1' });

      await service.unlinkItem('org1', 'vend1', 'item1');

      expect(mockPrismaService.vendorItem.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException when item link not found', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorItem.findUnique.mockResolvedValue(null);

      await expect(
        service.unlinkItem('org1', 'vend1', 'item1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getVendorItems', () => {
    it('should return paginated vendor items', async () => {
      const mockItem = { id: 'item1', code: 'ITEM001', name: 'Test Item' };
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.vendorItem.findMany.mockResolvedValue([{
        id: 'vi1',
        vendorId: 'vend1',
        itemId: 'item1',
        vendorSku: 'VSKU001',
        price: 100,
        leadTimeDays: 7,
        isPreferred: true,
        item: mockItem,
      }]);
      mockPrismaService.vendorItem.count.mockResolvedValue(1);

      const result = await service.getVendorItems('org1', 'vend1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history with bills and payments', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.purchaseBill.findMany.mockResolvedValue([{
        id: 'bill1',
        billNumber: 'BILL001',
        billDate: new Date(),
        dueDate: new Date(),
        total: 1000,
        amountPaid: 500,
        status: 'PARTIAL',
      }]);
      mockPrismaService.paymentMade.findMany.mockResolvedValue([{
        id: 'pmt1',
        paymentNumber: 'PMT001',
        paymentDate: new Date(),
        amount: 500,
        paymentMethod: 'BANK_TRANSFER',
      }]);

      const result = await service.getTransactionHistory('org1', 'vend1');

      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by transaction type', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.purchaseBill.findMany.mockResolvedValue([{
        id: 'bill1',
        billNumber: 'BILL001',
        billDate: new Date(),
        dueDate: new Date(),
        total: 1000,
        amountPaid: 500,
        status: 'PARTIAL',
      }]);

      const result = await service.getTransactionHistory('org1', 'vend1', { type: 'bill' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('bill');
    });
  });
});

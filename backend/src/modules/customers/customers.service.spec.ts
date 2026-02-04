import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '@/common/prisma';

describe('CustomersService', () => {
  let service: CustomersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockCustomer = {
    id: 'cust1',
    organizationId: 'org1',
    code: 'CUST001',
    companyName: 'Test Company',
    contactPerson: 'John Doe',
    phone: '0123456789',
    email: 'john@test.com',
    taxRegistrationNo: 'TAX123',
    paymentTerms: 'Net 30',
    creditLimit: 10000,
    balance: 0,
    notes: 'Test notes',
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    addresses: [],
    contacts: [],
  };

  const mockPrismaService: any = {
    customer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    customerAddress: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    customerContact: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    salesOrder: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
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
        CustomersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create('org1', {
        name: 'Test Company',
        email: 'john@test.com',
      });

      expect(result.code).toBe('CUST001');
      expect(result.name).toBe('Test Company');
      expect(mockPrismaService.customer.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when code already exists', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(
        service.create('org1', {
          code: 'CUST001',
          name: 'Test Company',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use provided code when given', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue({
        ...mockCustomer,
        code: 'CUSTOM001',
      });

      const result = await service.create('org1', {
        code: 'CUSTOM001',
        name: 'Test Company',
      });

      expect(result.code).toBe('CUSTOM001');
    });

    it('should create customer with addresses', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.create.mockResolvedValue({
        ...mockCustomer,
        addresses: [{
          id: 'addr1',
          label: 'Main Office',
          addressLine1: '123 Test St',
          city: 'Kuala Lumpur',
          state: 'WP',
          postalCode: '50000',
          country: 'Malaysia',
          isDefaultBilling: true,
          isDefaultShipping: true,
        }],
      });

      const result = await service.create('org1', {
        name: 'Test Company',
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
    it('should return paginated customers', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search term', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      await service.findAll('org1', { search: 'test' });

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should filter by isActive', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      await service.findAll('org1', { isActive: true });

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by ID', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findOne('org1', 'cust1');

      expect(result.id).toBe('cust1');
      expect(result.code).toBe('CUST001');
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByCode', () => {
    it('should return a customer by code', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findByCode('org1', 'CUST001');

      expect(result.code).toBe('CUST001');
    });

    it('should throw NotFoundException when customer not found by code', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.findByCode('org1', 'INVALID')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a customer successfully', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        companyName: 'Updated Company',
      });

      const result = await service.update('org1', 'cust1', { name: 'Updated Company' });

      expect(result.name).toBe('Updated Company');
    });

    it('should throw NotFoundException when updating non-existent customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.update('org1', 'nonexistent', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        deletedAt: new Date(),
        isActive: false,
      });

      await service.remove('org1', 'cust1');

      expect(mockPrismaService.customer.update).toHaveBeenCalledWith({
        where: { id: 'cust1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });

    it('should throw NotFoundException when removing non-existent customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.remove('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAddress', () => {
    it('should add an address to a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customerAddress.create.mockResolvedValue({
        id: 'addr1',
        customerId: 'cust1',
        label: 'Branch Office',
        addressLine1: '456 New St',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
        country: 'Malaysia',
        isDefaultBilling: false,
        isDefaultShipping: false,
      });

      const result = await service.addAddress('org1', 'cust1', {
        label: 'Branch Office',
        addressLine1: '456 New St',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
      });

      expect(result.label).toBe('Branch Office');
    });
  });

  describe('addContact', () => {
    it('should add a contact to a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customerContact.create.mockResolvedValue({
        id: 'contact1',
        customerId: 'cust1',
        name: 'Jane Doe',
        role: 'Sales Manager',
        phone: '0129876543',
        email: 'jane@test.com',
        isPrimary: false,
      });

      const result = await service.addContact('org1', 'cust1', {
        name: 'Jane Doe',
        designation: 'Sales Manager',
        phone: '0129876543',
        email: 'jane@test.com',
      });

      expect(result.name).toBe('Jane Doe');
    });
  });

  describe('getCreditInfo', () => {
    it('should return credit information for a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        creditLimit: 10000,
      });
      mockPrismaService.invoice.aggregate.mockResolvedValue({ _sum: { balanceDue: 2000 } });

      const result = await service.getCreditInfo('org1', 'cust1');

      expect(result).toBeDefined();
      expect(result.creditLimit).toBe(10000);
    });
  });
});

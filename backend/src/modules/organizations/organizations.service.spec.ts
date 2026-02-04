import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '@/common/prisma';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockOrganization = {
    id: 'org1',
    name: 'Test Organization',
    logo: 'https://example.com/logo.png',
    email: 'org@example.com',
    phone: '0123456789',
    address: '123 Test Street',
    city: 'Kuala Lumpur',
    state: 'WP',
    postalCode: '50000',
    country: 'Malaysia',
    taxRegistrationNo: 'TAX123456',
    baseCurrency: 'MYR',
    fiscalYearStart: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaxRate = {
    id: 'tax1',
    organizationId: 'org1',
    name: 'SST',
    rate: 6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNumberSequence = {
    id: 'seq1',
    organizationId: 'org1',
    documentType: 'PO',
    prefix: 'PO',
    currentNumber: 5,
    resetMonthly: true,
    lastResetDate: new Date(),
  };

  const mockPrismaService: any = {
    organization: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    taxRate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    numberSequence: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    item: {
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
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrganization', () => {
    it('should return organization by ID', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.getOrganization('org1');

      expect(result.id).toBe('org1');
      expect(result.name).toBe('Test Organization');
    });

    it('should throw NotFoundException when organization not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.getOrganization('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return organization with all properties', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrganization);

      const result = await service.getOrganization('org1');

      expect(result).toEqual({
        id: 'org1',
        name: 'Test Organization',
        logo: 'https://example.com/logo.png',
        email: 'org@example.com',
        phone: '0123456789',
        address: '123 Test Street',
        city: 'Kuala Lumpur',
        state: 'WP',
        postalCode: '50000',
        country: 'Malaysia',
        taxRegistrationNo: 'TAX123456',
        baseCurrency: 'MYR',
        fiscalYearStart: 1,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        name: 'Updated Organization',
      });

      const result = await service.updateOrganization('org1', { name: 'Updated Organization' });

      expect(result.name).toBe('Updated Organization');
    });

    it('should update multiple fields', async () => {
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        name: 'Updated Org',
        email: 'new@example.com',
        phone: '9876543210',
      });

      const result = await service.updateOrganization('org1', {
        name: 'Updated Org',
        email: 'new@example.com',
        phone: '9876543210',
      });

      expect(result.name).toBe('Updated Org');
      expect(result.email).toBe('new@example.com');
      expect(result.phone).toBe('9876543210');
    });

    it('should update address fields', async () => {
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        address: '456 New Street',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
      });

      const result = await service.updateOrganization('org1', {
        address: '456 New Street',
        city: 'Penang',
        state: 'Penang',
        postalCode: '10000',
      });

      expect(result.address).toBe('456 New Street');
      expect(result.city).toBe('Penang');
    });
  });

  describe('updateLogo', () => {
    it('should update organization logo', async () => {
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrganization,
        logo: 'https://example.com/new-logo.png',
      });

      const result = await service.updateLogo('org1', 'https://example.com/new-logo.png');

      expect(result.logo).toBe('https://example.com/new-logo.png');
      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: 'org1' },
        data: { logo: 'https://example.com/new-logo.png' },
      });
    });
  });

  describe('getTaxRates', () => {
    it('should return all tax rates for organization', async () => {
      mockPrismaService.taxRate.findMany.mockResolvedValue([mockTaxRate]);

      const result = await service.getTaxRates('org1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('SST');
      expect(result[0].rate).toBe(6);
    });

    it('should return empty array when no tax rates exist', async () => {
      mockPrismaService.taxRate.findMany.mockResolvedValue([]);

      const result = await service.getTaxRates('org1');

      expect(result).toHaveLength(0);
    });

    it('should return tax rates sorted by name', async () => {
      mockPrismaService.taxRate.findMany.mockResolvedValue([
        { ...mockTaxRate, name: 'SST' },
        { ...mockTaxRate, id: 'tax2', name: 'GST' },
      ]);

      await service.getTaxRates('org1');

      expect(mockPrismaService.taxRate.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('createTaxRate', () => {
    it('should create a tax rate successfully', async () => {
      mockPrismaService.taxRate.findUnique.mockResolvedValue(null);
      mockPrismaService.taxRate.create.mockResolvedValue(mockTaxRate);

      const result = await service.createTaxRate('org1', {
        name: 'SST',
        rate: 6,
      });

      expect(result.name).toBe('SST');
      expect(result.rate).toBe(6);
    });

    it('should throw BadRequestException when tax rate name already exists', async () => {
      mockPrismaService.taxRate.findUnique.mockResolvedValue(mockTaxRate);

      await expect(
        service.createTaxRate('org1', { name: 'SST', rate: 6 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create tax rate with isActive defaulting to true', async () => {
      mockPrismaService.taxRate.findUnique.mockResolvedValue(null);
      mockPrismaService.taxRate.create.mockResolvedValue(mockTaxRate);

      await service.createTaxRate('org1', { name: 'SST', rate: 6 });

      expect(mockPrismaService.taxRate.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org1',
          name: 'SST',
          rate: 6,
          isActive: true,
        },
      });
    });

    it('should create tax rate with explicit isActive value', async () => {
      mockPrismaService.taxRate.findUnique.mockResolvedValue(null);
      mockPrismaService.taxRate.create.mockResolvedValue({
        ...mockTaxRate,
        isActive: false,
      });

      await service.createTaxRate('org1', { name: 'SST', rate: 6, isActive: false });

      expect(mockPrismaService.taxRate.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org1',
          name: 'SST',
          rate: 6,
          isActive: false,
        },
      });
    });
  });

  describe('updateTaxRate', () => {
    it('should update a tax rate successfully', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.taxRate.update.mockResolvedValue({
        ...mockTaxRate,
        rate: 8,
      });

      const result = await service.updateTaxRate('org1', 'tax1', { rate: 8 });

      expect(result.rate).toBe(8);
    });

    it('should throw NotFoundException when tax rate not found', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(null);

      await expect(
        service.updateTaxRate('org1', 'nonexistent', { rate: 8 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating to duplicate name', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.taxRate.findUnique.mockResolvedValue({
        ...mockTaxRate,
        id: 'tax2',
        name: 'GST',
      });

      await expect(
        service.updateTaxRate('org1', 'tax1', { name: 'GST' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating to same name', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.taxRate.update.mockResolvedValue(mockTaxRate);

      const result = await service.updateTaxRate('org1', 'tax1', { name: 'SST' });

      expect(result.name).toBe('SST');
      expect(mockPrismaService.taxRate.findUnique).not.toHaveBeenCalled();
    });

    it('should update isActive status', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.taxRate.update.mockResolvedValue({
        ...mockTaxRate,
        isActive: false,
      });

      const result = await service.updateTaxRate('org1', 'tax1', { isActive: false });

      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteTaxRate', () => {
    it('should delete a tax rate successfully', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.item.count.mockResolvedValue(0);
      mockPrismaService.taxRate.delete.mockResolvedValue(mockTaxRate);

      await service.deleteTaxRate('org1', 'tax1');

      expect(mockPrismaService.taxRate.delete).toHaveBeenCalledWith({
        where: { id: 'tax1' },
      });
    });

    it('should throw NotFoundException when tax rate not found', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(null);

      await expect(service.deleteTaxRate('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when tax rate is in use', async () => {
      mockPrismaService.taxRate.findFirst.mockResolvedValue(mockTaxRate);
      mockPrismaService.item.count.mockResolvedValue(5);

      await expect(service.deleteTaxRate('org1', 'tax1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getNumberSequences', () => {
    it('should return all number sequences for organization', async () => {
      mockPrismaService.numberSequence.findMany.mockResolvedValue([mockNumberSequence]);

      const result = await service.getNumberSequences('org1');

      expect(result).toHaveLength(1);
      expect(result[0].documentType).toBe('PO');
      expect(result[0].prefix).toBe('PO');
    });

    it('should return empty array when no sequences exist', async () => {
      mockPrismaService.numberSequence.findMany.mockResolvedValue([]);

      const result = await service.getNumberSequences('org1');

      expect(result).toHaveLength(0);
    });

    it('should return sequences sorted by documentType', async () => {
      mockPrismaService.numberSequence.findMany.mockResolvedValue([
        mockNumberSequence,
        { ...mockNumberSequence, id: 'seq2', documentType: 'GRN', prefix: 'GRN' },
      ]);

      await service.getNumberSequences('org1');

      expect(mockPrismaService.numberSequence.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org1' },
        orderBy: { documentType: 'asc' },
      });
    });
  });

  describe('updateNumberSequence', () => {
    it('should update a number sequence successfully', async () => {
      mockPrismaService.numberSequence.findUnique.mockResolvedValue(mockNumberSequence);
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        prefix: 'PO-NEW',
      });

      const result = await service.updateNumberSequence('org1', 'PO', { prefix: 'PO-NEW' });

      expect(result.prefix).toBe('PO-NEW');
    });

    it('should throw NotFoundException when sequence not found', async () => {
      mockPrismaService.numberSequence.findUnique.mockResolvedValue(null);

      await expect(
        service.updateNumberSequence('org1', 'INVALID', { prefix: 'TEST' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update resetMonthly setting', async () => {
      mockPrismaService.numberSequence.findUnique.mockResolvedValue(mockNumberSequence);
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        resetMonthly: false,
      });

      const result = await service.updateNumberSequence('org1', 'PO', { resetMonthly: false });

      expect(result.resetMonthly).toBe(false);
    });
  });

  describe('getNextNumber', () => {
    it('should return next number in sequence', async () => {
      const currentDate = new Date();
      mockPrismaService.numberSequence.findUnique.mockResolvedValue({
        ...mockNumberSequence,
        lastResetDate: currentDate,
      });
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 6,
      });

      const result = await service.getNextNumber('org1', 'PO');

      expect(result).toMatch(/^PO-\d{6}-\d{5}$/);
    });

    it('should create sequence if not exists', async () => {
      mockPrismaService.numberSequence.findUnique.mockResolvedValue(null);
      mockPrismaService.numberSequence.create.mockResolvedValue({
        id: 'seq2',
        organizationId: 'org1',
        documentType: 'GRN',
        prefix: 'GRN',
        currentNumber: 0,
        resetMonthly: true,
        lastResetDate: new Date(),
      });
      mockPrismaService.numberSequence.update.mockResolvedValue({
        id: 'seq2',
        organizationId: 'org1',
        documentType: 'GRN',
        prefix: 'GRN',
        currentNumber: 1,
        resetMonthly: true,
        lastResetDate: new Date(),
      });

      const result = await service.getNextNumber('org1', 'GRN');

      expect(result).toMatch(/^GRN-\d{6}-\d{5}$/);
      expect(mockPrismaService.numberSequence.create).toHaveBeenCalled();
    });

    it('should reset number when month changes', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      mockPrismaService.numberSequence.findUnique.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 99,
        lastResetDate: lastMonth,
        resetMonthly: true,
      });
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 1,
      });

      const result = await service.getNextNumber('org1', 'PO');

      // Should reset to 1 (formatted as 00001)
      expect(result).toMatch(/^PO-\d{6}-00001$/);
    });

    it('should not reset number when resetMonthly is false', async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      mockPrismaService.numberSequence.findUnique.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 99,
        lastResetDate: lastMonth,
        resetMonthly: false,
      });
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 100,
      });

      const result = await service.getNextNumber('org1', 'PO');

      // Should continue from 99 to 100 (formatted as 00100)
      expect(result).toMatch(/^PO-\d{6}-00100$/);
    });

    it('should format number with year-month prefix', async () => {
      const now = new Date();
      const expectedYearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      mockPrismaService.numberSequence.findUnique.mockResolvedValue({
        ...mockNumberSequence,
        lastResetDate: now,
      });
      mockPrismaService.numberSequence.update.mockResolvedValue({
        ...mockNumberSequence,
        currentNumber: 6,
      });

      const result = await service.getNextNumber('org1', 'PO');

      expect(result).toContain(expectedYearMonth);
    });
  });
});

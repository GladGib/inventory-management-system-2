import { Test, TestingModule } from '@nestjs/testing';
import { SalesReturnsService } from './sales-returns.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('SalesReturnsService', () => {
  let service: SalesReturnsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    salesReturn: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    salesReturnLine: {
      updateMany: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
    },
    stockLevel: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
    warehouse: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesReturnsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SalesReturnsService>(SalesReturnsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sales return successfully', async () => {
      const mockInvoice = {
        id: 'inv1',
        customerId: 'cust1',
        lines: [
          {
            itemId: 'item1',
            quantity: 10,
            unitPrice: 100,
            taxPct: 6,
          },
        ],
      };

      const mockReturn = {
        id: 'ret1',
        returnNumber: 'RET-000001',
        customerId: 'cust1',
        customer: { id: 'cust1', companyName: 'Customer 1' },
        status: 'DRAFT',
        lines: [],
      };

      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.salesReturn.count.mockResolvedValue(0);
      mockPrismaService.salesReturn.create.mockResolvedValue(mockReturn);

      const result = await service.create('org1', {
        invoiceId: 'inv1',
        items: [{ itemId: 'item1', quantity: 5 }],
      });

      expect(result.returnNumber).toBe('RET-000001');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          invoiceId: 'invalid',
          items: [{ itemId: 'item1', quantity: 5 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when return quantity exceeds invoice', async () => {
      const mockInvoice = {
        id: 'inv1',
        customerId: 'cust1',
        lines: [
          { itemId: 'item1', quantity: 5, unitPrice: 100, taxPct: 0 },
        ],
      };

      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);

      await expect(
        service.create('org1', {
          invoiceId: 'inv1',
          items: [{ itemId: 'item1', quantity: 10 }], // Exceeds invoice qty
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return sales return when found', async () => {
      const mockReturn = {
        id: 'ret1',
        returnNumber: 'RET-000001',
        customer: { id: 'c1', companyName: 'Customer 1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);

      const result = await service.findOne('org1', 'ret1');

      expect(result.id).toBe('ret1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.salesReturn.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve', () => {
    it('should approve a draft return', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'DRAFT',
        customer: { id: 'c1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);
      mockPrismaService.salesReturn.update.mockResolvedValue({
        ...mockReturn,
        status: 'APPROVED',
      });

      const result = await service.approve('org1', 'ret1');

      expect(mockPrismaService.salesReturn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'APPROVED' },
        }),
      );
    });

    it('should throw error when return is not draft', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'COMPLETED',
        customer: { id: 'c1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);

      await expect(service.approve('org1', 'ret1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('receiveReturn', () => {
    it('should receive return and update stock', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'APPROVED',
        notes: '',
        customer: { id: 'c1' },
        lines: [],
      };

      const mockWarehouse = {
        id: 'wh1',
        isPrimary: true,
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);
      mockPrismaService.warehouse.findFirst.mockResolvedValue(mockWarehouse);
      mockPrismaService.stockLevel.findFirst.mockResolvedValue(null); // No existing stock level
      mockPrismaService.stockLevel.create.mockResolvedValue({ id: 'sl1', onHand: 5 });
      mockPrismaService.stockMovement.create.mockResolvedValue({ id: 'sm1' });
      mockPrismaService.salesReturnLine.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.salesReturn.update.mockResolvedValue({
        ...mockReturn,
        status: 'COMPLETED',
      });

      await service.receiveReturn('org1', 'ret1', {
        items: [{ itemId: 'item1', receivedQuantity: 5, restockable: true }],
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw error when return is not approved', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'DRAFT',
        customer: { id: 'c1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);

      await expect(
        service.receiveReturn('org1', 'ret1', {
          items: [{ itemId: 'item1', receivedQuantity: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a draft return', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'DRAFT',
        customer: { id: 'c1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);
      mockPrismaService.salesReturn.delete.mockResolvedValue(mockReturn);

      await service.delete('org1', 'ret1');

      expect(mockPrismaService.salesReturn.delete).toHaveBeenCalledWith({
        where: { id: 'ret1' },
      });
    });

    it('should throw error when trying to delete non-draft return', async () => {
      const mockReturn = {
        id: 'ret1',
        status: 'APPROVED',
        customer: { id: 'c1' },
        lines: [],
      };

      mockPrismaService.salesReturn.findFirst.mockResolvedValue(mockReturn);

      await expect(service.delete('org1', 'ret1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

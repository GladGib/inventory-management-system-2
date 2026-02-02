import { Test, TestingModule } from '@nestjs/testing';
import { BillsService } from './bills.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('BillsService', () => {
  let service: BillsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    purchaseBill: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    vendor: {
      findFirst: jest.fn(),
    },
    goodsReceivedNote: {
      findFirst: jest.fn(),
    },
    paymentMade: {
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillsService>(BillsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bill successfully', async () => {
      const mockVendor = {
        id: 'vendor1',
        companyName: 'Vendor 1',
        paymentTerms: 'Net 30',
      };

      const mockBill = {
        id: 'bill1',
        billNumber: 'BILL-000001',
        vendorId: 'vendor1',
        vendor: mockVendor,
        status: 'PENDING',
        subtotal: 1000,
        total: 1000,
        lines: [],
      };

      mockPrismaService.vendor.findFirst.mockResolvedValue(mockVendor);
      mockPrismaService.purchaseBill.count.mockResolvedValue(0);
      mockPrismaService.purchaseBill.create.mockResolvedValue(mockBill);

      const result = await service.create('org1', {
        vendorId: 'vendor1',
        items: [
          { quantity: 10, unitPrice: 100 },
        ],
      });

      expect(result.billNumber).toBe('BILL-000001');
      expect(mockPrismaService.purchaseBill.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when vendor not found', async () => {
      mockPrismaService.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.create('org1', {
          vendorId: 'invalid',
          items: [{ quantity: 1, unitPrice: 100 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return bill when found', async () => {
      const mockBill = {
        id: 'bill1',
        billNumber: 'BILL-000001',
        vendor: { id: 'v1', companyName: 'Vendor 1' },
        lines: [],
        payments: [],
      };

      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(mockBill);

      const result = await service.findOne('org1', 'bill1');

      expect(result.id).toBe('bill1');
    });

    it('should throw NotFoundException when bill not found', async () => {
      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('recordPayment', () => {
    it('should record payment and update bill status', async () => {
      const mockBill = {
        id: 'bill1',
        vendorId: 'v1',
        status: 'PENDING',
        total: 1000,
        amountPaid: 0,
        vendor: { id: 'v1' },
        lines: [],
        payments: [],
      };

      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.paymentMade.count.mockResolvedValue(0);

      await service.recordPayment('org1', 'bill1', {
        paymentDate: '2025-01-15',
        amount: 500,
        paymentMethod: 'Bank Transfer',
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw error when payment exceeds balance', async () => {
      const mockBill = {
        id: 'bill1',
        vendorId: 'v1',
        status: 'PENDING',
        total: 1000,
        amountPaid: 800,
        vendor: { id: 'v1' },
        lines: [],
        payments: [],
      };

      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(mockBill);

      await expect(
        service.recordPayment('org1', 'bill1', {
          paymentDate: '2025-01-15',
          amount: 500,
          paymentMethod: 'Cash',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('voidBill', () => {
    it('should void bill when no payments made', async () => {
      const mockBill = {
        id: 'bill1',
        status: 'PENDING',
        amountPaid: 0,
        vendor: { id: 'v1' },
        lines: [],
        payments: [],
      };

      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(mockBill);
      mockPrismaService.purchaseBill.update.mockResolvedValue({
        ...mockBill,
        status: 'VOID',
      });

      await service.voidBill('org1', 'bill1');

      expect(mockPrismaService.purchaseBill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'VOID' },
        }),
      );
    });

    it('should throw error when bill has payments', async () => {
      const mockBill = {
        id: 'bill1',
        status: 'PARTIALLY_PAID',
        amountPaid: 500,
        vendor: { id: 'v1' },
        lines: [],
        payments: [],
      };

      mockPrismaService.purchaseBill.findFirst.mockResolvedValue(mockBill);

      await expect(service.voidBill('org1', 'bill1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getPaymentSummary', () => {
    it('should calculate payment summary correctly', async () => {
      const now = new Date();
      const mockBills = [
        {
          status: 'PENDING',
          total: 1000,
          amountPaid: 0,
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          status: 'PARTIALLY_PAID',
          total: 2000,
          amountPaid: 500,
          dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Overdue
        },
      ];

      mockPrismaService.purchaseBill.findMany.mockResolvedValue(mockBills);

      const result = await service.getPaymentSummary('org1');

      expect(result.totalOutstanding).toBe(2500); // 1000 + 1500
      expect(result.totalOverdue).toBe(1500);
      expect(result.overdueCount).toBe(1);
    });
  });
});

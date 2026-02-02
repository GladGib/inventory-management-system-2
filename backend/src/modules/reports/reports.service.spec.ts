import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    salesOrder: {
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    salesOrderLine: {
      groupBy: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    stockLevel: {
      count: jest.fn(),
    },
    purchaseOrder: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    purchaseBill: {
      findMany: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalesSummary', () => {
    it('should return sales summary with correct totals', async () => {
      const mockOrders = [
        {
          id: '1',
          customerId: 'cust1',
          customer: { id: 'cust1', companyName: 'Customer 1' },
          status: 'CONFIRMED',
          total: 1000,
          orderDate: new Date('2025-01-01'),
          lines: [
            {
              itemId: 'item1',
              item: { id: 'item1', code: 'ITM001', name: 'Item 1', costPrice: 50 },
              quantity: 10,
              lineTotal: 500,
            },
          ],
        },
        {
          id: '2',
          customerId: 'cust1',
          customer: { id: 'cust1', companyName: 'Customer 1' },
          status: 'SHIPPED',
          total: 500,
          orderDate: new Date('2025-01-02'),
          lines: [
            {
              itemId: 'item1',
              item: { id: 'item1', code: 'ITM001', name: 'Item 1', costPrice: 50 },
              quantity: 5,
              lineTotal: 250,
            },
          ],
        },
      ];

      mockPrismaService.salesOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.getSalesSummary('org1', {});

      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenue).toBe(1500);
      expect(result.topCustomers).toHaveLength(1);
      expect(result.topCustomers[0].customerName).toBe('Customer 1');
      expect(result.topProducts).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      mockPrismaService.salesOrder.findMany.mockResolvedValue([]);

      await service.getSalesSummary('org1', {
        fromDate: '2025-01-01',
        toDate: '2025-01-31',
      });

      expect(mockPrismaService.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderDate: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary', async () => {
      const mockItems = [
        {
          id: 'item1',
          code: 'ITM001',
          name: 'Item 1',
          categoryId: 'cat1',
          category: { id: 'cat1', name: 'Category 1' },
          costPrice: 100,
          reorderPoint: 10,
          stockLevels: [
            { warehouseId: 'wh1', onHand: 50, warehouse: { id: 'wh1', name: 'Warehouse 1' } },
          ],
        },
        {
          id: 'item2',
          code: 'ITM002',
          name: 'Item 2',
          categoryId: 'cat1',
          category: { id: 'cat1', name: 'Category 1' },
          costPrice: 200,
          reorderPoint: 5,
          stockLevels: [
            { warehouseId: 'wh1', onHand: 0, warehouse: { id: 'wh1', name: 'Warehouse 1' } },
          ],
        },
      ];

      mockPrismaService.item.findMany.mockResolvedValue(mockItems);
      mockPrismaService.salesOrderLine.groupBy.mockResolvedValue([]);

      const result = await service.getInventorySummary('org1', {});

      expect(result.totalItems).toBe(2);
      expect(result.outOfStockItems).toBe(1);
      expect(result.stockByCategory).toHaveLength(1);
    });
  });

  describe('getPurchaseSummary', () => {
    it('should return purchase summary', async () => {
      const mockOrders = [
        {
          id: '1',
          vendorId: 'v1',
          vendor: { id: 'v1', companyName: 'Vendor 1' },
          status: 'RECEIVED',
          total: 5000,
          orderDate: new Date('2025-01-15'),
        },
      ];

      mockPrismaService.purchaseOrder.findMany.mockResolvedValue(mockOrders);

      const result = await service.getPurchaseSummary('org1', {});

      expect(result.totalOrders).toBe(1);
      expect(result.totalSpent).toBe(5000);
      expect(result.topVendors).toHaveLength(1);
    });
  });

  describe('getReceivablesSummary', () => {
    it('should calculate aging buckets correctly', async () => {
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      const mockInvoices = [
        {
          id: '1',
          customerId: 'c1',
          customer: { id: 'c1', companyName: 'Customer 1' },
          total: 1000,
          amountPaid: 0,
          dueDate: fifteenDaysAgo, // 1-30 days overdue
        },
        {
          id: '2',
          customerId: 'c1',
          customer: { id: 'c1', companyName: 'Customer 1' },
          total: 2000,
          amountPaid: 500,
          dueDate: fortyDaysAgo, // 31-60 days overdue
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.getReceivablesSummary('org1');

      expect(result.totalOutstanding).toBe(2500); // 1000 + 1500
      expect(result.overdueCount).toBe(2);
      expect(result.agingBuckets).toHaveLength(5);
    });
  });

  describe('getPayablesSummary', () => {
    it('should return payables summary', async () => {
      const now = new Date();
      const mockBills = [
        {
          id: '1',
          vendorId: 'v1',
          vendor: { id: 'v1', companyName: 'Vendor 1' },
          total: 3000,
          amountPaid: 1000,
          dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Not overdue
        },
      ];

      mockPrismaService.purchaseBill.findMany.mockResolvedValue(mockBills);

      const result = await service.getPayablesSummary('org1');

      expect(result.totalOutstanding).toBe(2000);
      expect(result.totalOverdue).toBe(0);
      expect(result.topCreditors).toHaveLength(1);
    });
  });
});

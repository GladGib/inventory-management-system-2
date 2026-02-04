import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '@/common/prisma';
import { OrganizationsService } from '../organizations/organizations.service';

describe('InvoicesService', () => {
  let service: InvoicesService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prisma: PrismaService;

  const mockCustomer = {
    id: 'cust1',
    code: 'CUST001',
    companyName: 'Test Customer',
    paymentTerms: 'Net 30',
    phone: '0123456789',
    email: 'test@customer.com',
    taxRegistrationNo: 'TAX123',
    addresses: [],
  };

  const mockSalesOrder = {
    id: 'so1',
    organizationId: 'org1',
    orderNumber: 'SO-0001',
    customerId: 'cust1',
    customer: mockCustomer,
    status: 'CONFIRMED',
    subtotal: 1000,
    discountAmount: 0,
    taxAmount: 60,
    total: 1060,
    notes: 'Test order',
    lines: [
      {
        id: 'line1',
        itemId: 'item1',
        item: { id: 'item1', code: 'ITEM001', name: 'Test Item' },
        quantity: 10,
        unitPrice: 100,
        discountPct: 0,
        taxPct: 6,
        lineTotal: 1000,
        notes: 'Line note',
      },
    ],
  };

  const mockInvoice = {
    id: 'inv1',
    organizationId: 'org1',
    invoiceNumber: 'INV-0001',
    customerId: 'cust1',
    customer: mockCustomer,
    salesOrderId: 'so1',
    salesOrder: { orderNumber: 'SO-0001' },
    invoiceDate: new Date(),
    dueDate: new Date(),
    status: 'DRAFT',
    subtotal: 1000,
    discountAmount: 0,
    taxAmount: 60,
    total: 1060,
    amountPaid: 0,
    notes: 'Test invoice',
    createdAt: new Date(),
    updatedAt: new Date(),
    lines: [
      {
        id: 'invline1',
        itemId: 'item1',
        item: { id: 'item1', code: 'ITEM001', name: 'Test Item' },
        description: 'Line note',
        quantity: 10,
        unitPrice: 100,
        discountPct: 0,
        taxPct: 6,
        lineTotal: 1000,
      },
    ],
  };

  const mockOrganizationsService = {
    getNextNumber: jest.fn(),
  };

  const mockPrismaService: any = {
    salesOrder: {
      findFirst: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    item: {
      findFirst: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    paymentReceived: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
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
        InvoicesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrganizationsService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromOrder', () => {
    it('should create invoice from sales order', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(mockSalesOrder);
      mockOrganizationsService.getNextNumber.mockResolvedValue('INV-0001');
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.createFromOrder('org1', {
        salesOrderId: 'so1',
      });

      expect(result.invoiceNumber).toBe('INV-0001');
      expect(result.customerId).toBe('cust1');
      expect(mockPrismaService.invoice.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sales order not found', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.createFromOrder('org1', { salesOrderId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order not confirmed', async () => {
      mockPrismaService.salesOrder.findFirst.mockResolvedValue({
        ...mockSalesOrder,
        status: 'DRAFT',
      });

      await expect(
        service.createFromOrder('org1', { salesOrderId: 'so1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createDirect', () => {
    it('should create direct invoice', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockOrganizationsService.getNextNumber.mockResolvedValue('INV-0001');
      mockPrismaService.item.findFirst.mockResolvedValue({
        id: 'item1',
        code: 'ITEM001',
        name: 'Test Item',
        sellingPrice: 100,
        taxRate: { rate: 6 },
      });
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.createDirect('org1', {
        customerId: 'cust1',
        lines: [
          { itemId: 'item1', quantity: 10 },
        ],
      });

      expect(result.invoiceNumber).toBe('INV-0001');
      expect(mockPrismaService.invoice.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.createDirect('org1', {
          customerId: 'nonexistent',
          lines: [{ itemId: 'item1', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockOrganizationsService.getNextNumber.mockResolvedValue('INV-0001');
      mockPrismaService.item.findFirst.mockResolvedValue(null);

      await expect(
        service.createDirect('org1', {
          customerId: 'cust1',
          lines: [{ itemId: 'nonexistent', quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated invoices', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([mockInvoice]);
      mockPrismaService.invoice.count.mockResolvedValue(1);

      const result = await service.findAll('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      await service.findAll('org1', { status: 'SENT' });

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'SENT' }),
        }),
      );
    });

    it('should filter by customerId', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      await service.findAll('org1', { customerId: 'cust1' });

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust1' }),
        }),
      );
    });

    it('should filter overdue invoices', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.count.mockResolvedValue(0);

      await service.findAll('org1', { overdue: true });

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.any(Object),
            status: { in: ['SENT', 'PARTIALLY_PAID'] },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return invoice by ID', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne('org1', 'inv1');

      expect(result.id).toBe('inv1');
      expect(result.invoiceNumber).toBe('INV-0001');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.findOne('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('send', () => {
    it('should mark invoice as sent', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
      });

      const result = await service.send('org1', 'inv1');

      expect(result.status).toBe('SENT');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.send('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when invoice already sent', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
      });

      await expect(service.send('org1', 'inv1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('void', () => {
    it('should void an invoice', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: 'VOID',
      });

      const result = await service.void('org1', 'inv1');

      expect(result.status).toBe('VOID');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.void('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when invoice has payments', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        amountPaid: 500,
      });

      await expect(service.void('org1', 'inv1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('recordPayment', () => {
    it('should record payment against invoice', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
      });
      mockOrganizationsService.getNextNumber.mockResolvedValue('PMT-0001');
      mockPrismaService.paymentReceived.create.mockResolvedValue({
        id: 'pmt1',
        paymentNumber: 'PMT-0001',
        customerId: 'cust1',
        customer: mockCustomer,
        paymentDate: new Date(),
        amount: 500,
        paymentMethod: 'BANK_TRANSFER',
        referenceNo: 'REF123',
        notes: 'Partial payment',
        createdAt: new Date(),
        allocations: [
          { invoiceId: 'inv1', invoice: { invoiceNumber: 'INV-0001' }, amount: 500 },
        ],
      });
      mockPrismaService.invoice.update.mockResolvedValue({});

      const result = await service.recordPayment('org1', 'inv1', {
        amount: 500,
        paymentMethod: 'BANK_TRANSFER',
        reference: 'REF123',
      });

      expect(result.amount).toBe(500);
      expect(result.paymentNumber).toBe('PMT-0001');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.recordPayment('org1', 'nonexistent', {
          amount: 500,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for draft invoice', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'DRAFT',
      });

      await expect(
        service.recordPayment('org1', 'inv1', {
          amount: 500,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for void invoice', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'VOID',
      });

      await expect(
        service.recordPayment('org1', 'inv1', {
          amount: 500,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amount exceeds balance due', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
        total: 1000,
        amountPaid: 800,
      });

      await expect(
        service.recordPayment('org1', 'inv1', {
          amount: 500,
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should mark invoice as PAID when fully paid', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: 'SENT',
        total: 1000,
        amountPaid: 0,
      });
      mockOrganizationsService.getNextNumber.mockResolvedValue('PMT-0001');
      mockPrismaService.paymentReceived.create.mockResolvedValue({
        id: 'pmt1',
        paymentNumber: 'PMT-0001',
        customerId: 'cust1',
        customer: mockCustomer,
        paymentDate: new Date(),
        amount: 1000,
        paymentMethod: 'BANK_TRANSFER',
        allocations: [{ invoiceId: 'inv1', invoice: { invoiceNumber: 'INV-0001' }, amount: 1000 }],
      });
      mockPrismaService.invoice.update.mockResolvedValue({});

      await service.recordPayment('org1', 'inv1', {
        amount: 1000,
        paymentMethod: 'BANK_TRANSFER',
      });

      expect(mockPrismaService.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv1' },
        data: {
          amountPaid: 1000,
          status: 'PAID',
        },
      });
    });
  });

  describe('getPayments', () => {
    it('should return paginated payments', async () => {
      const mockPayment = {
        id: 'pmt1',
        paymentNumber: 'PMT-0001',
        customerId: 'cust1',
        customer: mockCustomer,
        paymentDate: new Date(),
        amount: 500,
        paymentMethod: 'BANK_TRANSFER',
        referenceNo: 'REF123',
        notes: 'Test payment',
        createdAt: new Date(),
        allocations: [
          { invoiceId: 'inv1', invoice: { invoiceNumber: 'INV-0001' }, amount: 500 },
        ],
      };

      mockPrismaService.paymentReceived.findMany.mockResolvedValue([mockPayment]);
      mockPrismaService.paymentReceived.count.mockResolvedValue(1);

      const result = await service.getPayments('org1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by customerId', async () => {
      mockPrismaService.paymentReceived.findMany.mockResolvedValue([]);
      mockPrismaService.paymentReceived.count.mockResolvedValue(0);

      await service.getPayments('org1', { customerId: 'cust1' });

      expect(mockPrismaService.paymentReceived.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust1' }),
        }),
      );
    });
  });

  describe('getInvoiceForPdf', () => {
    it('should return invoice data for PDF generation', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        customer: {
          ...mockCustomer,
          addresses: [
            {
              addressLine1: '123 Test St',
              addressLine2: 'Suite 100',
              city: 'Kuala Lumpur',
              state: 'WP',
              postalCode: '50000',
            },
          ],
        },
      });
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org1',
        name: 'Test Organization',
        address: '456 Org St',
        phone: '0123456789',
        email: 'org@test.com',
        taxRegistrationNo: 'ORG-TAX-123',
      });

      const result = await service.getInvoiceForPdf('org1', 'inv1');

      expect(result.invoiceNumber).toBe('INV-0001');
      expect(result.organization.name).toBe('Test Organization');
      expect(result.customer.companyName).toBe('Test Customer');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.getInvoiceForPdf('org1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma';
import { ItemType } from '@prisma/client';

/**
 * Creates and initializes a NestJS test application with the proper module
 * configuration, global prefix, validation pipes, and cookie parser.
 */
export async function setupTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Logs in with the given credentials and returns a JWT access token.
 */
export async function getAuthToken(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (!response.body?.data?.accessToken) {
    throw new Error(
      `Login failed for ${email}: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.data.accessToken;
}

/**
 * Seeds a test organization and returns its data.
 */
export async function seedOrganization(
  prisma: PrismaService,
  idSuffix: string,
) {
  const org = {
    id: `test-org-${idSuffix}`,
    name: `Test Organization ${idSuffix}`,
    baseCurrency: 'MYR',
    country: 'Malaysia',
  };

  await prisma.organization.create({ data: org });
  return org;
}

/**
 * Seeds a test user with admin role and returns the user data plus
 * the plain-text password. Also seeds the associated Role.
 */
export async function seedUser(
  prisma: PrismaService,
  orgId: string,
  idSuffix: string,
) {
  const role = {
    id: `test-role-${idSuffix}`,
    organizationId: orgId,
    name: 'Administrator',
    permissions: ['all'],
    isSystem: false,
  };

  const passwordPlain = 'password123';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const user = {
    id: `test-user-${idSuffix}`,
    organizationId: orgId,
    email: `e2e-${idSuffix}@example.com`,
    passwordHash,
    firstName: 'E2E',
    lastName: 'Tester',
    roleId: role.id,
    isActive: true,
  };

  await prisma.role.create({ data: role });
  await prisma.user.create({ data: user });

  return { user, role, passwordPlain };
}

/**
 * Seeds a test warehouse and returns its data.
 */
export async function seedWarehouse(
  prisma: PrismaService,
  orgId: string,
  idSuffix: string,
  overrides?: { code?: string; name?: string; isPrimary?: boolean },
) {
  const warehouse = {
    id: `test-warehouse-${idSuffix}`,
    organizationId: orgId,
    code: overrides?.code || `WH-${idSuffix.toUpperCase()}`,
    name: overrides?.name || `Warehouse ${idSuffix}`,
    isPrimary: overrides?.isPrimary ?? true,
    isActive: true,
  };

  await prisma.warehouse.create({ data: warehouse });
  return warehouse;
}

/**
 * Seeds a specified number of test items, optionally with stock levels in a
 * warehouse. Returns the array of created items.
 */
export async function seedItems(
  prisma: PrismaService,
  orgId: string,
  count: number,
  idSuffix: string,
  options?: {
    warehouseId?: string;
    stockQty?: number;
  },
) {
  const items: any[] = [];

  for (let i = 1; i <= count; i++) {
    const item = {
      id: `test-item-${idSuffix}-${i}`,
      organizationId: orgId,
      code: `ITEM-${idSuffix.toUpperCase()}-${String(i).padStart(3, '0')}`,
      name: `Test Item ${idSuffix} ${i}`,
      type: ItemType.SIMPLE,
      uom: 'pcs',
      costPrice: 10.0 * i,
      sellingPrice: 20.0 * i,
      trackInventory: true,
      isActive: true,
    };

    await prisma.item.create({ data: item });
    items.push(item);

    if (options?.warehouseId) {
      const stockLevel = {
        id: `test-stock-${idSuffix}-${i}`,
        itemId: item.id,
        warehouseId: options.warehouseId,
        onHand: options.stockQty ?? 100,
        committed: 0,
        onOrder: 0,
      };
      await prisma.stockLevel.create({ data: stockLevel });
    }
  }

  return items;
}

/**
 * Seeds a test customer and returns its data.
 */
export async function seedCustomer(
  prisma: PrismaService,
  orgId: string,
  idSuffix: string,
) {
  const customer = {
    id: `test-customer-${idSuffix}`,
    organizationId: orgId,
    code: `CUST-${idSuffix.toUpperCase()}`,
    companyName: `Test Customer ${idSuffix}`,
    contactPerson: 'Jane Doe',
    email: `customer-${idSuffix}@example.com`,
    phone: '+60 12-000 0001',
    isActive: true,
  };

  await prisma.customer.create({ data: customer });
  return customer;
}

/**
 * Seeds a test vendor and returns its data.
 */
export async function seedVendor(
  prisma: PrismaService,
  orgId: string,
  idSuffix: string,
) {
  const vendor = {
    id: `test-vendor-${idSuffix}`,
    organizationId: orgId,
    code: `VEND-${idSuffix.toUpperCase()}`,
    companyName: `Test Vendor ${idSuffix}`,
    contactPerson: 'John Smith',
    email: `vendor-${idSuffix}@example.com`,
    phone: '+60 12-000 0002',
    paymentTerms: 'Net 30',
    isActive: true,
  };

  await prisma.vendor.create({ data: vendor });
  return vendor;
}

/**
 * Seeds number sequences for the common document types within an organization.
 */
export async function seedNumberSequences(
  prisma: PrismaService,
  orgId: string,
  idSuffix: string,
) {
  const types = [
    { documentType: 'PO', prefix: 'PO' },
    { documentType: 'SO', prefix: 'SO' },
    { documentType: 'GRN', prefix: 'GRN' },
    { documentType: 'INV', prefix: 'INV' },
    { documentType: 'PMT', prefix: 'PMT' },
    { documentType: 'CN', prefix: 'CN' },
    { documentType: 'BILL', prefix: 'BILL' },
    { documentType: 'ADJ', prefix: 'ADJ' },
    { documentType: 'TRF', prefix: 'TRF' },
    { documentType: 'CNT', prefix: 'CNT' },
    { documentType: 'SHIP', prefix: 'SHIP' },
    { documentType: 'PICK', prefix: 'PICK' },
    { documentType: 'RET', prefix: 'RET' },
    { documentType: 'VCN', prefix: 'VCN' },
  ];

  const sequences: any[] = [];
  for (const t of types) {
    const seq = {
      id: `test-numseq-${idSuffix}-${t.documentType}`,
      organizationId: orgId,
      documentType: t.documentType,
      prefix: t.prefix,
      currentNumber: 0,
      resetMonthly: true,
      lastResetDate: new Date(),
    };
    await prisma.numberSequence.create({ data: seq });
    sequences.push(seq);
  }

  return sequences;
}

/**
 * Comprehensively cleans up all test data for a given organization, respecting
 * foreign key constraints via ordered deletions.
 */
export async function cleanupDatabase(
  prisma: PrismaService,
  orgId: string,
  userId?: string,
) {
  // Credit note related
  await prisma.creditNoteRefund.deleteMany({
    where: { creditNote: { organizationId: orgId } },
  });
  await prisma.creditNoteApplication.deleteMany({
    where: { creditNote: { organizationId: orgId } },
  });
  await prisma.creditNoteLine.deleteMany({
    where: { creditNote: { organizationId: orgId } },
  });
  await prisma.creditNote.deleteMany({ where: { organizationId: orgId } });

  // Sales returns
  await prisma.salesReturnLine.deleteMany({
    where: { salesReturn: { organizationId: orgId } },
  });
  await prisma.salesReturn.deleteMany({ where: { organizationId: orgId } });

  // Invoice/Payment related
  await prisma.paymentAllocation.deleteMany({
    where: { paymentReceived: { organizationId: orgId } },
  });
  await prisma.paymentReceived.deleteMany({
    where: { organizationId: orgId },
  });
  await prisma.invoiceLine.deleteMany({
    where: { invoice: { organizationId: orgId } },
  });
  await prisma.invoice.deleteMany({ where: { organizationId: orgId } });

  // Shipments
  await prisma.shipmentLine.deleteMany({
    where: { shipment: { salesOrder: { organizationId: orgId } } },
  });
  await prisma.shipment.deleteMany({
    where: { salesOrder: { organizationId: orgId } },
  });

  // Pick lists
  await prisma.pickListLine.deleteMany({
    where: { pickList: { salesOrder: { organizationId: orgId } } },
  });
  await prisma.pickList.deleteMany({
    where: { salesOrder: { organizationId: orgId } },
  });

  // Sales orders
  await prisma.salesOrderLine.deleteMany({
    where: { salesOrder: { organizationId: orgId } },
  });
  await prisma.salesOrder.deleteMany({ where: { organizationId: orgId } });

  // Vendor credit notes
  await prisma.vendorCreditNoteApplication.deleteMany({
    where: { vendorCreditNote: { organizationId: orgId } },
  });
  await prisma.vendorCreditNoteLine.deleteMany({
    where: { vendorCreditNote: { organizationId: orgId } },
  });
  await prisma.vendorCreditNote.deleteMany({
    where: { organizationId: orgId },
  });

  // Bill payments
  await prisma.billPaymentAllocation.deleteMany({
    where: { paymentMade: { organizationId: orgId } },
  });
  await prisma.paymentMade.deleteMany({ where: { organizationId: orgId } });

  // Purchase bills
  await prisma.purchaseBillLine.deleteMany({
    where: { bill: { organizationId: orgId } },
  });
  await prisma.purchaseBill.deleteMany({ where: { organizationId: orgId } });

  // GRN
  await prisma.gRNLine.deleteMany({
    where: { grn: { organizationId: orgId } },
  });
  await prisma.goodsReceivedNote.deleteMany({
    where: { organizationId: orgId },
  });

  // Purchase orders
  await prisma.purchaseOrderLine.deleteMany({
    where: { purchaseOrder: { organizationId: orgId } },
  });
  await prisma.purchaseOrder.deleteMany({ where: { organizationId: orgId } });

  // Stock management
  await prisma.stockCountLine.deleteMany({
    where: { stockCount: { organizationId: orgId } },
  });
  await prisma.stockCount.deleteMany({ where: { organizationId: orgId } });

  await prisma.stockTransferLine.deleteMany({
    where: { transfer: { organizationId: orgId } },
  });
  await prisma.stockTransfer.deleteMany({ where: { organizationId: orgId } });

  await prisma.stockAdjustmentLine.deleteMany({
    where: { adjustment: { organizationId: orgId } },
  });
  await prisma.stockAdjustment.deleteMany({
    where: { organizationId: orgId },
  });

  // Stock
  await prisma.stockMovement.deleteMany({
    where: { item: { organizationId: orgId } },
  });
  await prisma.stockLevel.deleteMany({
    where: { item: { organizationId: orgId } },
  });

  // Vendor items
  await prisma.vendorItem.deleteMany({
    where: { vendor: { organizationId: orgId } },
  });

  // Items
  // Delete variant items first (those with parentItemId)
  await prisma.item.deleteMany({
    where: { organizationId: orgId, parentItemId: { not: null } },
  });
  await prisma.item.deleteMany({ where: { organizationId: orgId } });

  // Warehouses
  await prisma.binLocation.deleteMany({
    where: { warehouse: { organizationId: orgId } },
  });
  await prisma.warehouse.deleteMany({ where: { organizationId: orgId } });

  // Customers
  await prisma.customerAddress.deleteMany({
    where: { customer: { organizationId: orgId } },
  });
  await prisma.customerContact.deleteMany({
    where: { customer: { organizationId: orgId } },
  });
  await prisma.customer.deleteMany({ where: { organizationId: orgId } });

  // Vendors
  await prisma.vendorAddress.deleteMany({
    where: { vendor: { organizationId: orgId } },
  });
  await prisma.vendorContact.deleteMany({
    where: { vendor: { organizationId: orgId } },
  });
  await prisma.vendor.deleteMany({ where: { organizationId: orgId } });

  // Number sequences
  await prisma.numberSequence.deleteMany({
    where: { organizationId: orgId },
  });

  // Categories
  await prisma.category.deleteMany({ where: { organizationId: orgId } });

  // Tax rates
  await prisma.taxRate.deleteMany({ where: { organizationId: orgId } });

  // Auth tokens
  if (userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.passwordReset.deleteMany({ where: { userId } });
  }

  // Users + Roles
  await prisma.user.deleteMany({ where: { organizationId: orgId } });
  await prisma.role.deleteMany({ where: { organizationId: orgId } });

  // Organization
  await prisma.organization.deleteMany({ where: { id: orgId } });
}

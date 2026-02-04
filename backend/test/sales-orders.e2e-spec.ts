import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';
import * as bcrypt from 'bcrypt';
import { ItemType } from '@prisma/client';

describe('Sales Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Test data
  const testOrganization = {
    id: 'test-org-sales',
    name: 'Test Organization Sales',
    baseCurrency: 'MYR',
    country: 'Malaysia',
  };

  const testRole = {
    id: 'test-role-sales',
    organizationId: 'test-org-sales',
    name: 'Administrator',
    permissions: ['all'],
    isSystem: false,
  };

  const testUser = {
    id: 'test-user-sales',
    organizationId: 'test-org-sales',
    email: 'sales.test@example.com',
    passwordHash: '',
    firstName: 'Sales',
    lastName: 'Tester',
    roleId: 'test-role-sales',
    isActive: true,
  };

  const testCustomer = {
    id: 'test-customer-sales',
    organizationId: 'test-org-sales',
    code: 'CUST-001',
    companyName: 'Test Customer Company',
    contactPerson: 'John Doe',
    email: 'customer@example.com',
    phone: '+60 12-345 6789',
    isActive: true,
  };

  const testWarehouse = {
    id: 'test-warehouse-sales',
    organizationId: 'test-org-sales',
    code: 'WH-001',
    name: 'Main Warehouse',
    isPrimary: true,
    isActive: true,
  };

  const testItem1 = {
    id: 'test-item-sales-1',
    organizationId: 'test-org-sales',
    code: 'ITEM-SALES-001',
    name: 'Test Sales Item 1',
    type: ItemType.SIMPLE,
    uom: 'pcs',
    costPrice: 10.0,
    sellingPrice: 20.0,
    trackInventory: true,
    isActive: true,
  };

  const testItem2 = {
    id: 'test-item-sales-2',
    organizationId: 'test-org-sales',
    code: 'ITEM-SALES-002',
    name: 'Test Sales Item 2',
    type: ItemType.SIMPLE,
    uom: 'box',
    costPrice: 50.0,
    sellingPrice: 100.0,
    trackInventory: true,
    isActive: true,
  };

  // Stock levels for testing
  const stockLevel1 = {
    id: 'stock-level-1',
    itemId: 'test-item-sales-1',
    warehouseId: 'test-warehouse-sales',
    onHand: 100,
    committed: 0,
    onOrder: 0,
  };

  const stockLevel2 = {
    id: 'stock-level-2',
    itemId: 'test-item-sales-2',
    warehouseId: 'test-warehouse-sales',
    onHand: 50,
    committed: 0,
    onOrder: 0,
  };

  // Number sequence for sales orders
  const numberSequence = {
    id: 'num-seq-so-sales',
    organizationId: 'test-org-sales',
    documentType: 'SO',
    prefix: 'SO',
    currentNumber: 0,
    resetMonthly: true,
    lastResetDate: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser.passwordHash = hashedPassword;

    // Clean up any existing test data
    await cleanupTestData();

    // Create test data
    await prisma.organization.create({ data: testOrganization });
    await prisma.role.create({ data: testRole });
    await prisma.user.create({ data: testUser });
    await prisma.customer.create({ data: testCustomer });
    await prisma.warehouse.create({ data: testWarehouse });
    await prisma.item.create({ data: testItem1 });
    await prisma.item.create({ data: testItem2 });
    await prisma.stockLevel.create({ data: stockLevel1 });
    await prisma.stockLevel.create({ data: stockLevel2 });
    await prisma.numberSequence.create({ data: numberSequence });

    // Get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'password123' });
    accessToken = loginResponse.body.data.accessToken;
  });

  async function cleanupTestData() {
    // Clean up in correct order (respecting foreign key constraints)
    await prisma.shipmentLine.deleteMany({
      where: { shipment: { salesOrder: { organizationId: testOrganization.id } } },
    });
    await prisma.shipment.deleteMany({
      where: { salesOrder: { organizationId: testOrganization.id } },
    });
    await prisma.pickListLine.deleteMany({
      where: { pickList: { salesOrder: { organizationId: testOrganization.id } } },
    });
    await prisma.pickList.deleteMany({
      where: { salesOrder: { organizationId: testOrganization.id } },
    });
    await prisma.salesOrderLine.deleteMany({
      where: { salesOrder: { organizationId: testOrganization.id } },
    });
    await prisma.salesOrder.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.stockMovement.deleteMany({
      where: { item: { organizationId: testOrganization.id } },
    });
    await prisma.stockLevel.deleteMany({
      where: { item: { organizationId: testOrganization.id } },
    });
    await prisma.item.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.warehouse.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.customer.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.numberSequence.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.refreshToken.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.role.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.organization.deleteMany({
      where: { id: testOrganization.id },
    });
  }

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('GET /api/v1/sales-orders', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .expect(401);
    });

    it('should return list of sales orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .query({ status: 'DRAFT' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter by customerId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .query({ customerId: testCustomer.id })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

      const response = await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .query({ fromDate, toDate })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/v1/sales-orders', () => {
    afterEach(async () => {
      // Clean up created orders
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrder: { organizationId: testOrganization.id } },
      });
      await prisma.salesOrder.deleteMany({
        where: { organizationId: testOrganization.id },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .send({
          customerId: testCustomer.id,
          lines: [{ itemId: testItem1.id, quantity: 5 }],
        })
        .expect(401);
    });

    it('should create a new sales order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 5 },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.orderNumber).toBeDefined();
      expect(response.body.data.customerId).toBe(testCustomer.id);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.lines).toBeDefined();
      expect(response.body.data.lines.length).toBe(1);
    });

    it('should create order with multiple lines', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 10 },
            { itemId: testItem2.id, quantity: 5, unitPrice: 90.0 },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.lines.length).toBe(2);
    });

    it('should create order with optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Test order notes',
          internalNotes: 'Internal notes',
          discountPercent: 5,
          lines: [
            { itemId: testItem1.id, quantity: 5, discountPercent: 10 },
          ],
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.notes).toBe('Test order notes');
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          // Missing customerId and lines
        })
        .expect(400);
    });

    it('should validate line items have quantity', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          lines: [
            { itemId: testItem1.id }, // Missing quantity
          ],
        })
        .expect(400);
    });

    it('should validate quantity is positive', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          lines: [
            { itemId: testItem1.id, quantity: 0 },
          ],
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/sales-orders/:id', () => {
    let salesOrder: any;

    beforeAll(async () => {
      // Create a sales order for testing
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 10 },
          ],
        });
      salesOrder = response.body.data;
    });

    afterAll(async () => {
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrder.deleteMany({
        where: { id: salesOrder?.id },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/sales-orders/${salesOrder.id}`)
        .expect(401);
    });

    it('should return sales order by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/sales-orders/${salesOrder.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(salesOrder.id);
      expect(response.body.data.orderNumber).toBe(salesOrder.orderNumber);
      expect(response.body.data.lines).toBeDefined();
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/sales-orders/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/sales-orders/:id', () => {
    let salesOrder: any;

    beforeEach(async () => {
      // Create a draft sales order for testing
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 10 },
          ],
        });
      salesOrder = response.body.data;
    });

    afterEach(async () => {
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrder.deleteMany({
        where: { id: salesOrder?.id },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/sales-orders/${salesOrder.id}`)
        .send({ notes: 'Updated notes' })
        .expect(401);
    });

    it('should update draft sales order', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/sales-orders/${salesOrder.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notes: 'Updated notes',
          discountPercent: 10,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.notes).toBe('Updated notes');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/sales-orders/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notes: 'Updated' })
        .expect(404);
    });
  });

  describe('Sales Order Line Operations', () => {
    let salesOrder: any;

    beforeEach(async () => {
      // Create a draft sales order for testing
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 10 },
          ],
        });
      salesOrder = response.body.data;
    });

    afterEach(async () => {
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrder.deleteMany({
        where: { id: salesOrder?.id },
      });
    });

    describe('POST /api/v1/sales-orders/:id/lines', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/lines`)
          .send({ itemId: testItem2.id, quantity: 5 })
          .expect(401);
      });

      it('should add line to draft order', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/lines`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ itemId: testItem2.id, quantity: 5 })
          .expect(201);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.lines.length).toBe(2);
      });

      it('should validate line data', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/lines`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ itemId: testItem2.id, quantity: -1 })
          .expect(400);
      });
    });

    describe('PUT /api/v1/sales-orders/:id/lines/:lineId', () => {
      it('should require authentication', async () => {
        const lineId = salesOrder.lines[0].id;
        await request(app.getHttpServer())
          .put(`/api/v1/sales-orders/${salesOrder.id}/lines/${lineId}`)
          .send({ quantity: 15 })
          .expect(401);
      });

      it('should update line in draft order', async () => {
        const lineId = salesOrder.lines[0].id;
        const response = await request(app.getHttpServer())
          .put(`/api/v1/sales-orders/${salesOrder.id}/lines/${lineId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ quantity: 15, unitPrice: 25.0 })
          .expect(200);

        expect(response.body.data).toBeDefined();
        const updatedLine = response.body.data.lines.find((l: any) => l.id === lineId);
        expect(updatedLine.quantity).toBe(15);
      });
    });

    describe('DELETE /api/v1/sales-orders/:id/lines/:lineId', () => {
      beforeEach(async () => {
        // Add another line to delete
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/lines`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ itemId: testItem2.id, quantity: 5 });

        // Refresh salesOrder data
        const response = await request(app.getHttpServer())
          .get(`/api/v1/sales-orders/${salesOrder.id}`)
          .set('Authorization', `Bearer ${accessToken}`);
        salesOrder = response.body.data;
      });

      it('should require authentication', async () => {
        const lineId = salesOrder.lines[1].id;
        await request(app.getHttpServer())
          .delete(`/api/v1/sales-orders/${salesOrder.id}/lines/${lineId}`)
          .expect(401);
      });

      it('should remove line from draft order', async () => {
        const lineId = salesOrder.lines[1].id;
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/sales-orders/${salesOrder.id}/lines/${lineId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.lines.length).toBe(1);
      });
    });
  });

  describe('Sales Order Workflow', () => {
    let salesOrder: any;

    beforeEach(async () => {
      // Reset stock levels
      await prisma.stockLevel.update({
        where: { id: stockLevel1.id },
        data: { onHand: 100, committed: 0 },
      });
      await prisma.stockLevel.update({
        where: { id: stockLevel2.id },
        data: { onHand: 50, committed: 0 },
      });

      // Create a draft sales order for testing
      const response = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [
            { itemId: testItem1.id, quantity: 10 },
          ],
        });
      salesOrder = response.body.data;
    });

    afterEach(async () => {
      // Clean up all related data
      await prisma.shipmentLine.deleteMany({
        where: { shipment: { salesOrderId: salesOrder?.id } },
      });
      await prisma.shipment.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.pickListLine.deleteMany({
        where: { pickList: { salesOrderId: salesOrder?.id } },
      });
      await prisma.pickList.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrder.deleteMany({
        where: { id: salesOrder?.id },
      });
      // Reset stock levels
      await prisma.stockLevel.update({
        where: { id: stockLevel1.id },
        data: { onHand: 100, committed: 0 },
      });
    });

    describe('POST /api/v1/sales-orders/:id/confirm', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
          .expect(401);
      });

      it('should confirm draft order and allocate stock', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ warehouseId: testWarehouse.id })
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('CONFIRMED');

        // Verify stock was committed
        const stockLevel = await prisma.stockLevel.findUnique({
          where: { id: stockLevel1.id },
        });
        expect(stockLevel?.committed).toBe(10);
      });

      it('should reject confirmation for insufficient stock', async () => {
        // Create an order with more items than available
        const largeOrderResponse = await request(app.getHttpServer())
          .post('/api/v1/sales-orders')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            customerId: testCustomer.id,
            warehouseId: testWarehouse.id,
            lines: [
              { itemId: testItem1.id, quantity: 200 }, // More than available (100)
            ],
          });

        const largeOrder = largeOrderResponse.body.data;

        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${largeOrder.id}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ warehouseId: testWarehouse.id })
          .expect(400);

        // Clean up
        await prisma.salesOrderLine.deleteMany({
          where: { salesOrderId: largeOrder.id },
        });
        await prisma.salesOrder.delete({
          where: { id: largeOrder.id },
        });
      });
    });

    describe('POST /api/v1/sales-orders/:id/cancel', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/cancel`)
          .expect(401);
      });

      it('should cancel draft order', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/cancel`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('CANCELLED');
      });

      it('should cancel confirmed order and release stock', async () => {
        // First confirm the order
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ warehouseId: testWarehouse.id });

        // Then cancel it
        const response = await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/cancel`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data.status).toBe('CANCELLED');

        // Verify stock was released
        const stockLevel = await prisma.stockLevel.findUnique({
          where: { id: stockLevel1.id },
        });
        expect(stockLevel?.committed).toBe(0);
      });
    });

    describe('Pick List Operations', () => {
      beforeEach(async () => {
        // Confirm the order first
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ warehouseId: testWarehouse.id });
      });

      describe('POST /api/v1/sales-orders/:id/pick-list', () => {
        it('should require authentication', async () => {
          await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/pick-list`)
            .expect(401);
        });

        it('should create pick list for confirmed order', async () => {
          const response = await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/pick-list`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(201);

          expect(response.body.data).toBeDefined();
          expect(response.body.data.pickListNumber).toBeDefined();
          expect(response.body.data.salesOrderId).toBe(salesOrder.id);
          expect(response.body.data.lines).toBeDefined();
        });
      });

      describe('POST /api/v1/pick-lists/:id/process', () => {
        let pickList: any;

        beforeEach(async () => {
          // Create a pick list
          const response = await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/pick-list`)
            .set('Authorization', `Bearer ${accessToken}`);
          pickList = response.body.data;
        });

        it('should require authentication', async () => {
          await request(app.getHttpServer())
            .post(`/api/v1/pick-lists/${pickList.id}/process`)
            .send({
              lines: [{ lineId: pickList.lines[0].id, quantityPicked: 10 }],
            })
            .expect(401);
        });

        it('should process pick list', async () => {
          const response = await request(app.getHttpServer())
            .post(`/api/v1/pick-lists/${pickList.id}/process`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              lines: [{ lineId: pickList.lines[0].id, quantityPicked: 10 }],
            })
            .expect(200);

          expect(response.body.data).toBeDefined();
          expect(response.body.data.status).toBe('COMPLETED');
        });
      });
    });

    describe('Shipment Operations', () => {
      beforeEach(async () => {
        // Confirm the order and process picking
        await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ warehouseId: testWarehouse.id });

        const pickListResponse = await request(app.getHttpServer())
          .post(`/api/v1/sales-orders/${salesOrder.id}/pick-list`)
          .set('Authorization', `Bearer ${accessToken}`);

        const pickList = pickListResponse.body.data;

        await request(app.getHttpServer())
          .post(`/api/v1/pick-lists/${pickList.id}/process`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            lines: [{ lineId: pickList.lines[0].id, quantityPicked: 10 }],
          });
      });

      describe('POST /api/v1/sales-orders/:id/shipments', () => {
        it('should require authentication', async () => {
          await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
            .send({
              carrier: 'Test Carrier',
              lines: [{ itemId: testItem1.id, quantity: 10 }],
            })
            .expect(401);
        });

        it('should create shipment for order', async () => {
          const response = await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              carrier: 'Test Carrier',
              trackingNumber: 'TRACK123',
              lines: [{ itemId: testItem1.id, quantity: 10 }],
            })
            .expect(201);

          expect(response.body.data).toBeDefined();
          expect(response.body.data.shipmentNumber).toBeDefined();
          expect(response.body.data.carrier).toBe('Test Carrier');
          expect(response.body.data.trackingNumber).toBe('TRACK123');
        });
      });

      describe('GET /api/v1/sales-orders/:id/shipments', () => {
        beforeEach(async () => {
          // Create a shipment
          await request(app.getHttpServer())
            .post(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              carrier: 'Test Carrier',
              lines: [{ itemId: testItem1.id, quantity: 10 }],
            });
        });

        it('should require authentication', async () => {
          await request(app.getHttpServer())
            .get(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
            .expect(401);
        });

        it('should return shipments for order', async () => {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

          expect(response.body.data).toBeDefined();
          expect(Array.isArray(response.body.data)).toBe(true);
          expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        });
      });
    });
  });

  describe('Shipments Controller', () => {
    let salesOrder: any;
    let shipment: any;

    beforeAll(async () => {
      // Reset stock levels
      await prisma.stockLevel.update({
        where: { id: stockLevel1.id },
        data: { onHand: 100, committed: 0 },
      });

      // Create and process an order with shipment
      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          customerId: testCustomer.id,
          warehouseId: testWarehouse.id,
          lines: [{ itemId: testItem1.id, quantity: 10 }],
        });
      salesOrder = orderResponse.body.data;

      await request(app.getHttpServer())
        .post(`/api/v1/sales-orders/${salesOrder.id}/confirm`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ warehouseId: testWarehouse.id });

      const pickListResponse = await request(app.getHttpServer())
        .post(`/api/v1/sales-orders/${salesOrder.id}/pick-list`)
        .set('Authorization', `Bearer ${accessToken}`);

      const pickList = pickListResponse.body.data;

      await request(app.getHttpServer())
        .post(`/api/v1/pick-lists/${pickList.id}/process`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          lines: [{ lineId: pickList.lines[0].id, quantityPicked: 10 }],
        });

      const shipmentResponse = await request(app.getHttpServer())
        .post(`/api/v1/sales-orders/${salesOrder.id}/shipments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          carrier: 'Test Carrier',
          lines: [{ itemId: testItem1.id, quantity: 10 }],
        });
      shipment = shipmentResponse.body.data;
    });

    afterAll(async () => {
      await prisma.shipmentLine.deleteMany({
        where: { shipmentId: shipment?.id },
      });
      await prisma.shipment.deleteMany({
        where: { id: shipment?.id },
      });
      await prisma.pickListLine.deleteMany({
        where: { pickList: { salesOrderId: salesOrder?.id } },
      });
      await prisma.pickList.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrderId: salesOrder?.id },
      });
      await prisma.salesOrder.deleteMany({
        where: { id: salesOrder?.id },
      });
    });

    describe('GET /api/v1/shipments/:id', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shipments/${shipment.id}`)
          .expect(401);
      });

      it('should return shipment by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shipments/${shipment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe(shipment.id);
        expect(response.body.data.shipmentNumber).toBe(shipment.shipmentNumber);
      });
    });

    describe('PUT /api/v1/shipments/:id', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .put(`/api/v1/shipments/${shipment.id}`)
          .send({ trackingNumber: 'NEW-TRACK-123' })
          .expect(401);
      });

      it('should update shipment', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/shipments/${shipment.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            trackingNumber: 'UPDATED-TRACK-123',
            notes: 'Updated notes',
          })
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.trackingNumber).toBe('UPDATED-TRACK-123');
      });
    });

    describe('POST /api/v1/shipments/:id/deliver', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/shipments/${shipment.id}/deliver`)
          .expect(401);
      });

      it('should mark shipment as delivered', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/shipments/${shipment.id}/deliver`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBe('DELIVERED');
        expect(response.body.data.deliveredDate).toBeDefined();
      });
    });
  });

  describe('Token Validation', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/sales-orders')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});

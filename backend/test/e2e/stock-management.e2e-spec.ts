import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/common/prisma';
import {
  setupTestApp,
  getAuthToken,
  seedOrganization,
  seedUser,
  seedWarehouse,
  seedItems,
  seedNumberSequences,
  cleanupDatabase,
} from '../helpers';

describe('Stock Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Seeded reference data
  let org: any;
  let user: any;
  let warehouseA: any;
  let warehouseB: any;
  let items: any[];

  const SUFFIX = 'stk-mgmt';

  beforeAll(async () => {
    app = await setupTestApp();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean any stale data from a previous run
    await cleanupDatabase(prisma, `test-org-${SUFFIX}`, `test-user-${SUFFIX}`);

    // Seed reference data
    org = await seedOrganization(prisma, SUFFIX);
    const userData = await seedUser(prisma, org.id, SUFFIX);
    user = userData.user;

    warehouseA = await seedWarehouse(prisma, org.id, `${SUFFIX}-a`, {
      code: 'WH-A',
      name: 'Warehouse A',
      isPrimary: true,
    });
    warehouseB = await seedWarehouse(prisma, org.id, `${SUFFIX}-b`, {
      code: 'WH-B',
      name: 'Warehouse B',
      isPrimary: false,
    });

    items = await seedItems(prisma, org.id, 3, SUFFIX, {
      warehouseId: warehouseA.id,
      stockQty: 100,
    });

    // Also create stock levels for warehouseB with zero stock
    for (let i = 0; i < items.length; i++) {
      await prisma.stockLevel.create({
        data: {
          id: `test-stock-${SUFFIX}-b-${i + 1}`,
          itemId: items[i].id,
          warehouseId: warehouseB.id,
          onHand: 0,
          committed: 0,
          onOrder: 0,
        },
      });
    }

    await seedNumberSequences(prisma, org.id, SUFFIX);

    accessToken = await getAuthToken(app, user.email, userData.passwordPlain);
  }, 60_000);

  afterAll(async () => {
    await cleanupDatabase(prisma, org.id, user.id);
    await app.close();
  });

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  const api = () => request(app.getHttpServer());
  const auth = (req: request.Test) =>
    req.set('Authorization', `Bearer ${accessToken}`);

  /** Reset stock levels for both warehouses to initial seeded values */
  async function resetStock() {
    for (const item of items) {
      await prisma.stockLevel.updateMany({
        where: { itemId: item.id, warehouseId: warehouseA.id },
        data: { onHand: 100, committed: 0, onOrder: 0 },
      });
      await prisma.stockLevel.updateMany({
        where: { itemId: item.id, warehouseId: warehouseB.id },
        data: { onHand: 0, committed: 0, onOrder: 0 },
      });
    }
    await prisma.stockMovement.deleteMany({
      where: { item: { organizationId: org.id } },
    });
  }

  // ---------------------------------------------------------------
  // 1. Stock Adjustment - ADD (write-in) and confirm
  // ---------------------------------------------------------------
  describe('Stock adjustment (ADD) and confirm', () => {
    let adjustmentId: string;

    afterAll(async () => {
      await prisma.stockAdjustmentLine.deleteMany({
        where: { adjustment: { organizationId: org.id } },
      });
      await prisma.stockAdjustment.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('Step 1: Create stock adjustment (ADD)', async () => {
      const res = await auth(api().post('/api/v1/stock-adjustments'))
        .send({
          warehouseId: warehouseA.id,
          adjustmentType: 'ADD',
          reason: 'E2E write-in test',
          lines: [
            { itemId: items[0].id, quantity: 25, notes: 'Found extra stock' },
            { itemId: items[1].id, quantity: 10 },
          ],
        })
        .expect(201);

      const adj = res.body.data;
      adjustmentId = adj.id;

      expect(adj.id).toBeDefined();
      expect(adj.adjustmentNumber).toBeDefined();
      expect(adj.adjustmentType).toBe('ADD');
      expect(adj.status).toBe('DRAFT');
      expect(adj.lines).toHaveLength(2);
    });

    it('Step 2: Confirm adjustment', async () => {
      const res = await auth(
        api().post(`/api/v1/stock-adjustments/${adjustmentId}/confirm`),
      ).expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');
    });

    it('Step 3: Verify stock levels updated', async () => {
      const stock0 = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouseA.id },
      });
      const stock1 = await prisma.stockLevel.findFirst({
        where: { itemId: items[1].id, warehouseId: warehouseA.id },
      });

      // Original was 100, added 25 => 125
      expect(stock0?.onHand).toBe(125);
      // Original was 100, added 10 => 110
      expect(stock1?.onHand).toBe(110);
    });
  });

  // ---------------------------------------------------------------
  // 2. Stock Adjustment - SUBTRACT (damage/shrinkage)
  // ---------------------------------------------------------------
  describe('Stock adjustment (SUBTRACT / DAMAGE)', () => {
    let adjustmentId: string;

    afterAll(async () => {
      await prisma.stockAdjustmentLine.deleteMany({
        where: { adjustment: { organizationId: org.id } },
      });
      await prisma.stockAdjustment.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('should create and confirm a DAMAGE adjustment', async () => {
      // Create
      const createRes = await auth(api().post('/api/v1/stock-adjustments'))
        .send({
          warehouseId: warehouseA.id,
          adjustmentType: 'DAMAGE',
          reason: 'Water damage during storage',
          lines: [{ itemId: items[0].id, quantity: -15 }],
        })
        .expect(201);

      adjustmentId = createRes.body.data.id;
      expect(createRes.body.data.adjustmentType).toBe('DAMAGE');

      // Confirm
      await auth(
        api().post(`/api/v1/stock-adjustments/${adjustmentId}/confirm`),
      ).expect(200);

      // Verify stock decreased: 100 - 15 = 85
      const stock = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouseA.id },
      });
      expect(stock?.onHand).toBe(85);
    });
  });

  // ---------------------------------------------------------------
  // 3. Stock Transfer between warehouses
  // ---------------------------------------------------------------
  describe('Stock transfer between warehouses', () => {
    let transferId: string;

    afterAll(async () => {
      await prisma.stockTransferLine.deleteMany({
        where: { transfer: { organizationId: org.id } },
      });
      await prisma.stockTransfer.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('Step 1: Create stock transfer from Warehouse A to Warehouse B', async () => {
      const res = await auth(api().post('/api/v1/stock-transfers'))
        .send({
          fromWarehouseId: warehouseA.id,
          toWarehouseId: warehouseB.id,
          notes: 'E2E transfer test',
          lines: [
            { itemId: items[0].id, quantity: 30 },
            { itemId: items[1].id, quantity: 20 },
          ],
        })
        .expect(201);

      const transfer = res.body.data;
      transferId = transfer.id;

      expect(transfer.id).toBeDefined();
      expect(transfer.transferNumber).toBeDefined();
      expect(transfer.fromWarehouseId).toBe(warehouseA.id);
      expect(transfer.toWarehouseId).toBe(warehouseB.id);
      expect(transfer.status).toBe('DRAFT');
      expect(transfer.lines).toHaveLength(2);
    });

    it('Step 2: Confirm (complete) the transfer', async () => {
      const res = await auth(
        api().post(`/api/v1/stock-transfers/${transferId}/confirm`),
      ).expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('Step 3: Verify stock levels in both warehouses', async () => {
      // Warehouse A: item0 = 100 - 30 = 70, item1 = 100 - 20 = 80
      const stockA0 = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouseA.id },
      });
      const stockA1 = await prisma.stockLevel.findFirst({
        where: { itemId: items[1].id, warehouseId: warehouseA.id },
      });
      expect(stockA0?.onHand).toBe(70);
      expect(stockA1?.onHand).toBe(80);

      // Warehouse B: item0 = 0 + 30 = 30, item1 = 0 + 20 = 20
      const stockB0 = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouseB.id },
      });
      const stockB1 = await prisma.stockLevel.findFirst({
        where: { itemId: items[1].id, warehouseId: warehouseB.id },
      });
      expect(stockB0?.onHand).toBe(30);
      expect(stockB1?.onHand).toBe(20);
    });
  });

  // ---------------------------------------------------------------
  // 4. Stock Count workflow
  // ---------------------------------------------------------------
  describe('Stock count workflow', () => {
    let countId: string;
    let countLines: any[];

    afterAll(async () => {
      // Stock count adjustments may have been auto-created
      await prisma.stockAdjustmentLine.deleteMany({
        where: { adjustment: { organizationId: org.id } },
      });
      await prisma.stockAdjustment.deleteMany({
        where: { organizationId: org.id },
      });
      await prisma.stockCountLine.deleteMany({
        where: { stockCount: { organizationId: org.id } },
      });
      await prisma.stockCount.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('Step 1: Create stock count for specific items', async () => {
      const res = await auth(api().post('/api/v1/stock-counts'))
        .send({
          warehouseId: warehouseA.id,
          notes: 'E2E stock count test',
          itemIds: [items[0].id, items[1].id],
        })
        .expect(201);

      const count = res.body.data;
      countId = count.id;
      countLines = count.lines;

      expect(count.id).toBeDefined();
      expect(count.countNumber).toBeDefined();
      expect(count.warehouseId).toBe(warehouseA.id);
      expect(count.status).toBe('DRAFT');
      expect(count.lines.length).toBeGreaterThanOrEqual(2);

      // System quantities should reflect current on-hand
      for (const line of count.lines) {
        expect(line.systemQty).toBe(100);
        expect(line.countedQty).toBeNull();
      }
    });

    it('Step 2: Record counted quantities', async () => {
      const line0 = countLines.find((l: any) => l.itemId === items[0].id);
      const line1 = countLines.find((l: any) => l.itemId === items[1].id);

      const res = await auth(
        api().post(`/api/v1/stock-counts/${countId}/record`),
      )
        .send([
          { lineId: line0.id, countedQty: 95 },
          { lineId: line1.id, countedQty: 105 },
        ])
        .expect(200);

      const updatedCount = res.body.data;
      const updatedLine0 = updatedCount.lines.find(
        (l: any) => l.itemId === items[0].id,
      );
      const updatedLine1 = updatedCount.lines.find(
        (l: any) => l.itemId === items[1].id,
      );

      expect(updatedLine0.countedQty).toBe(95);
      expect(updatedLine1.countedQty).toBe(105);
    });

    it('Step 3: Review variances', async () => {
      const res = await auth(
        api().get(`/api/v1/stock-counts/${countId}`),
      ).expect(200);

      const count = res.body.data;
      const line0 = count.lines.find((l: any) => l.itemId === items[0].id);
      const line1 = count.lines.find((l: any) => l.itemId === items[1].id);

      // Variance = countedQty - systemQty
      expect(line0.variance).toBe(-5); // 95 - 100
      expect(line1.variance).toBe(5); // 105 - 100
    });

    it('Step 4: Complete stock count and generate adjustment', async () => {
      const res = await auth(
        api().post(`/api/v1/stock-counts/${countId}/complete`),
      )
        .query({ createAdjustment: true })
        .expect(200);

      const count = res.body.data;
      expect(count.status).toBe('COMPLETED');
      expect(count.completedAt).toBeDefined();
    });

    it('Step 5: Verify stock levels reflect counted quantities', async () => {
      // After completing with createAdjustment=true, stock should match counts
      const stock0 = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouseA.id },
      });
      const stock1 = await prisma.stockLevel.findFirst({
        where: { itemId: items[1].id, warehouseId: warehouseA.id },
      });

      expect(stock0?.onHand).toBe(95);
      expect(stock1?.onHand).toBe(105);
    });
  });

  // ---------------------------------------------------------------
  // 5. Stock count - full count (no itemIds specified)
  // ---------------------------------------------------------------
  describe('Full stock count (all items in warehouse)', () => {
    let countId: string;

    afterAll(async () => {
      await prisma.stockAdjustmentLine.deleteMany({
        where: { adjustment: { organizationId: org.id } },
      });
      await prisma.stockAdjustment.deleteMany({
        where: { organizationId: org.id },
      });
      await prisma.stockCountLine.deleteMany({
        where: { stockCount: { organizationId: org.id } },
      });
      await prisma.stockCount.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('should create a full count without specifying itemIds', async () => {
      const res = await auth(api().post('/api/v1/stock-counts'))
        .send({
          warehouseId: warehouseA.id,
          notes: 'Full count for E2E',
        })
        .expect(201);

      countId = res.body.data.id;

      // Should include all items with stock in warehouseA
      expect(res.body.data.lines.length).toBeGreaterThanOrEqual(items.length);
    });
  });

  // ---------------------------------------------------------------
  // 6. Stock movements query
  // ---------------------------------------------------------------
  describe('Stock movements', () => {
    let adjustmentId: string;

    afterAll(async () => {
      await prisma.stockAdjustmentLine.deleteMany({
        where: { adjustment: { organizationId: org.id } },
      });
      await prisma.stockAdjustment.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('should record and query stock movements after adjustment', async () => {
      // Create and confirm adjustment to generate movements
      const adjRes = await auth(api().post('/api/v1/stock-adjustments'))
        .send({
          warehouseId: warehouseA.id,
          adjustmentType: 'ADD',
          reason: 'Movement query test',
          lines: [{ itemId: items[0].id, quantity: 5 }],
        })
        .expect(201);
      adjustmentId = adjRes.body.data.id;

      await auth(
        api().post(`/api/v1/stock-adjustments/${adjustmentId}/confirm`),
      ).expect(200);

      // Query movements
      const res = await auth(api().get('/api/v1/stock-movements'))
        .query({ itemId: items[0].id, warehouseId: warehouseA.id })
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      // Check the latest movement
      const latestMovement = res.body.data[0];
      expect(latestMovement.itemId).toBe(items[0].id);
      expect(latestMovement.warehouseId).toBe(warehouseA.id);
      expect(latestMovement.quantity).toBe(5);
    });
  });

  // ---------------------------------------------------------------
  // 7. Validation
  // ---------------------------------------------------------------
  describe('Validation', () => {
    it('should reject adjustment without warehouseId', async () => {
      await auth(api().post('/api/v1/stock-adjustments'))
        .send({
          adjustmentType: 'ADD',
          lines: [{ itemId: items[0].id, quantity: 10 }],
        })
        .expect(400);
    });

    it('should reject transfer with same source and destination', async () => {
      const res = await auth(api().post('/api/v1/stock-transfers'))
        .send({
          fromWarehouseId: warehouseA.id,
          toWarehouseId: warehouseA.id,
          lines: [{ itemId: items[0].id, quantity: 10 }],
        });

      // Service should reject same-warehouse transfers with 400
      expect([400, 422]).toContain(res.status);
    });

    it('should require authentication for stock endpoints', async () => {
      await api().get('/api/v1/stock-adjustments').expect(401);
      await api().get('/api/v1/stock-movements').expect(401);
      await api().get('/api/v1/stock-counts').expect(401);
    });
  });
});

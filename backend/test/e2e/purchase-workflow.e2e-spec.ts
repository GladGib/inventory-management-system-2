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
  seedVendor,
  seedNumberSequences,
  cleanupDatabase,
} from '../helpers';

describe('Purchase Order Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Seeded reference data
  let org: any;
  let user: any;
  let vendor: any;
  let warehouse: any;
  let items: any[];

  const SUFFIX = 'po-wf';

  beforeAll(async () => {
    app = await setupTestApp();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean any stale data from a previous run
    await cleanupDatabase(prisma, `test-org-${SUFFIX}`, `test-user-${SUFFIX}`);

    // Seed reference data
    org = await seedOrganization(prisma, SUFFIX);
    const userData = await seedUser(prisma, org.id, SUFFIX);
    user = userData.user;
    vendor = await seedVendor(prisma, org.id, SUFFIX);
    warehouse = await seedWarehouse(prisma, org.id, SUFFIX);
    items = await seedItems(prisma, org.id, 3, SUFFIX, {
      warehouseId: warehouse.id,
      stockQty: 50,
    });
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

  // ---------------------------------------------------------------
  // 1. Create PO with line items
  // ---------------------------------------------------------------
  describe('Create PO with line items', () => {
    let poId: string;

    afterAll(async () => {
      // cleanup PO created in this block if it still exists
      if (poId) {
        await prisma.purchaseOrderLine.deleteMany({
          where: { purchaseOrderId: poId },
        });
        await prisma.purchaseOrder.deleteMany({ where: { id: poId } });
      }
    });

    it('should create a purchase order in DRAFT status', async () => {
      const res = await auth(api().post('/api/v1/purchase-orders'))
        .send({
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          notes: 'E2E test PO',
          lines: [
            { itemId: items[0].id, quantity: 20, unitCost: 10 },
            { itemId: items[1].id, quantity: 15, unitCost: 20 },
          ],
        })
        .expect(201);

      const po = res.body.data;
      poId = po.id;

      expect(po.id).toBeDefined();
      expect(po.poNumber).toBeDefined();
      expect(po.status).toBe('DRAFT');
      expect(po.vendorId).toBe(vendor.id);
      expect(po.lines).toHaveLength(2);
      expect(po.lines[0].quantity).toBe(20);
      expect(po.lines[1].quantity).toBe(15);
    });

    it('should retrieve the created PO by ID', async () => {
      const res = await auth(
        api().get(`/api/v1/purchase-orders/${poId}`),
      ).expect(200);

      expect(res.body.data.id).toBe(poId);
      expect(res.body.data.lines).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------
  // 2. Full PO lifecycle: Issue -> GRN -> Bill -> Payment
  // ---------------------------------------------------------------
  describe('Full PO lifecycle (Issue -> Receive -> Bill -> Pay)', () => {
    let poId: string;
    let poLines: any[];
    let grnId: string;
    let billId: string;

    afterAll(async () => {
      // cleanup in correct FK order
      if (billId) {
        await prisma.billPaymentAllocation.deleteMany({
          where: { paymentMade: { organizationId: org.id } },
        });
        await prisma.paymentMade.deleteMany({
          where: { organizationId: org.id },
        });
        await prisma.purchaseBillLine.deleteMany({
          where: { bill: { id: billId } },
        });
        await prisma.purchaseBill.deleteMany({ where: { id: billId } });
      }
      if (grnId) {
        await prisma.gRNLine.deleteMany({ where: { grnId } });
        await prisma.goodsReceivedNote.deleteMany({ where: { id: grnId } });
      }
      if (poId) {
        await prisma.purchaseOrderLine.deleteMany({
          where: { purchaseOrderId: poId },
        });
        await prisma.purchaseOrder.deleteMany({ where: { id: poId } });
      }
      // Reset stock levels
      for (const item of items) {
        await prisma.stockLevel.updateMany({
          where: { itemId: item.id, warehouseId: warehouse.id },
          data: { onHand: 50, committed: 0, onOrder: 0 },
        });
      }
      // Remove stock movements generated during the test
      await prisma.stockMovement.deleteMany({
        where: { item: { organizationId: org.id } },
      });
    });

    it('Step 1: Create PO', async () => {
      const res = await auth(api().post('/api/v1/purchase-orders'))
        .send({
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          lines: [
            { itemId: items[0].id, quantity: 30, unitCost: 10 },
            { itemId: items[1].id, quantity: 20, unitCost: 20 },
          ],
        })
        .expect(201);

      poId = res.body.data.id;
      poLines = res.body.data.lines;
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('Step 2: Issue (send) PO to vendor', async () => {
      const res = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/send`),
      ).expect(200);

      expect(res.body.data.status).toBe('ISSUED');
    });

    it('Step 3: Create GRN to fully receive the PO', async () => {
      const res = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/receive`),
      )
        .send({
          warehouseId: warehouse.id,
          lines: [
            { poLineId: poLines[0].id, quantityReceived: 30 },
            { poLineId: poLines[1].id, quantityReceived: 20 },
          ],
        })
        .expect(201);

      const grn = res.body.data;
      grnId = grn.id;

      expect(grn.id).toBeDefined();
      expect(grn.grnNumber).toBeDefined();
      expect(grn.lines).toHaveLength(2);

      // PO should now be RECEIVED
      const poRes = await auth(
        api().get(`/api/v1/purchase-orders/${poId}`),
      ).expect(200);

      expect(poRes.body.data.status).toBe('RECEIVED');
    });

    it('Step 4: Create purchase bill from GRN', async () => {
      const res = await auth(api().post('/api/v1/bills/from-grn'))
        .send({ grnId })
        .expect(201);

      const bill = res.body.data;
      billId = bill.id;

      expect(bill.id).toBeDefined();
      expect(bill.billNumber).toBeDefined();
      expect(bill.vendorId).toBe(vendor.id);
      expect(bill.totalAmount).toBeGreaterThan(0);
    });

    it('Step 5: Record payment on the bill', async () => {
      // Fetch bill to know totalAmount
      const billRes = await auth(
        api().get(`/api/v1/bills/${billId}`),
      ).expect(200);
      const totalAmount = billRes.body.data.totalAmount;

      const res = await auth(
        api().post(`/api/v1/bills/${billId}/payments`),
      )
        .send({
          paymentDate: new Date().toISOString(),
          amount: totalAmount,
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'PAY-E2E-001',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();

      // Bill should now be PAID
      const updatedBill = await auth(
        api().get(`/api/v1/bills/${billId}`),
      ).expect(200);

      expect(updatedBill.body.data.status).toBe('PAID');
    });
  });

  // ---------------------------------------------------------------
  // 3. Partial receiving (PARTIALLY_RECEIVED)
  // ---------------------------------------------------------------
  describe('Partial receiving', () => {
    let poId: string;
    let poLines: any[];
    let grnId1: string;
    let grnId2: string;

    afterAll(async () => {
      // Cleanup GRNs
      for (const gid of [grnId2, grnId1].filter(Boolean)) {
        await prisma.gRNLine.deleteMany({ where: { grnId: gid } });
        await prisma.goodsReceivedNote.deleteMany({ where: { id: gid } });
      }
      if (poId) {
        await prisma.purchaseOrderLine.deleteMany({
          where: { purchaseOrderId: poId },
        });
        await prisma.purchaseOrder.deleteMany({ where: { id: poId } });
      }
      for (const item of items) {
        await prisma.stockLevel.updateMany({
          where: { itemId: item.id, warehouseId: warehouse.id },
          data: { onHand: 50, committed: 0, onOrder: 0 },
        });
      }
      await prisma.stockMovement.deleteMany({
        where: { item: { organizationId: org.id } },
      });
    });

    it('Step 1: Create and issue PO', async () => {
      const createRes = await auth(api().post('/api/v1/purchase-orders'))
        .send({
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          lines: [
            { itemId: items[0].id, quantity: 50, unitCost: 10 },
            { itemId: items[1].id, quantity: 40, unitCost: 20 },
          ],
        })
        .expect(201);

      poId = createRes.body.data.id;
      poLines = createRes.body.data.lines;

      await auth(
        api().post(`/api/v1/purchase-orders/${poId}/send`),
      ).expect(200);
    });

    it('Step 2: Partially receive the PO (first GRN)', async () => {
      const res = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/receive`),
      )
        .send({
          warehouseId: warehouse.id,
          lines: [
            { poLineId: poLines[0].id, quantityReceived: 20 },
            { poLineId: poLines[1].id, quantityReceived: 10 },
          ],
        })
        .expect(201);

      grnId1 = res.body.data.id;

      // PO should now be PARTIALLY_RECEIVED
      const poRes = await auth(
        api().get(`/api/v1/purchase-orders/${poId}`),
      ).expect(200);

      expect(poRes.body.data.status).toBe('PARTIALLY_RECEIVED');

      // Verify quantityReceived on lines
      const line0 = poRes.body.data.lines.find(
        (l: any) => l.id === poLines[0].id,
      );
      const line1 = poRes.body.data.lines.find(
        (l: any) => l.id === poLines[1].id,
      );
      expect(line0.quantityReceived).toBe(20);
      expect(line1.quantityReceived).toBe(10);
    });

    it('Step 3: Receive remaining items (second GRN)', async () => {
      const res = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/receive`),
      )
        .send({
          warehouseId: warehouse.id,
          lines: [
            { poLineId: poLines[0].id, quantityReceived: 30 },
            { poLineId: poLines[1].id, quantityReceived: 30 },
          ],
        })
        .expect(201);

      grnId2 = res.body.data.id;

      // PO should now be fully RECEIVED
      const poRes = await auth(
        api().get(`/api/v1/purchase-orders/${poId}`),
      ).expect(200);

      expect(poRes.body.data.status).toBe('RECEIVED');
    });
  });

  // ---------------------------------------------------------------
  // 4. Add line to existing draft PO
  // ---------------------------------------------------------------
  describe('Add line to existing draft PO', () => {
    let poId: string;

    afterAll(async () => {
      if (poId) {
        await prisma.purchaseOrderLine.deleteMany({
          where: { purchaseOrderId: poId },
        });
        await prisma.purchaseOrder.deleteMany({ where: { id: poId } });
      }
    });

    it('should add a new line item to a draft PO', async () => {
      // Create PO with one line
      const createRes = await auth(api().post('/api/v1/purchase-orders'))
        .send({
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          lines: [{ itemId: items[0].id, quantity: 10, unitCost: 10 }],
        })
        .expect(201);

      poId = createRes.body.data.id;
      expect(createRes.body.data.lines).toHaveLength(1);

      // Add second line
      const addRes = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/lines`),
      )
        .send({ itemId: items[2].id, quantity: 25, unitCost: 30 })
        .expect(201);

      expect(addRes.body.data.lines).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------
  // 5. Cancel PO
  // ---------------------------------------------------------------
  describe('Cancel PO', () => {
    let poId: string;

    afterAll(async () => {
      if (poId) {
        await prisma.purchaseOrderLine.deleteMany({
          where: { purchaseOrderId: poId },
        });
        await prisma.purchaseOrder.deleteMany({ where: { id: poId } });
      }
    });

    it('should cancel a draft PO', async () => {
      const createRes = await auth(api().post('/api/v1/purchase-orders'))
        .send({
          vendorId: vendor.id,
          lines: [{ itemId: items[0].id, quantity: 5 }],
        })
        .expect(201);

      poId = createRes.body.data.id;

      const cancelRes = await auth(
        api().post(`/api/v1/purchase-orders/${poId}/cancel`),
      ).expect(200);

      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });
  });

  // ---------------------------------------------------------------
  // 6. Validation: missing required fields
  // ---------------------------------------------------------------
  describe('Validation', () => {
    it('should reject PO without vendorId', async () => {
      await auth(api().post('/api/v1/purchase-orders'))
        .send({
          lines: [{ itemId: items[0].id, quantity: 10 }],
        })
        .expect(400);
    });

    it('should reject PO without lines', async () => {
      await auth(api().post('/api/v1/purchase-orders'))
        .send({ vendorId: vendor.id })
        .expect(400);
    });

    it('should require authentication', async () => {
      await api()
        .get('/api/v1/purchase-orders')
        .expect(401);
    });
  });
});

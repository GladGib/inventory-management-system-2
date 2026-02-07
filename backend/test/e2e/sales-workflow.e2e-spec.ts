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
  seedCustomer,
  seedNumberSequences,
  cleanupDatabase,
} from '../helpers';

describe('Sales Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Seeded reference data
  let org: any;
  let user: any;
  let customer: any;
  let warehouse: any;
  let items: any[];

  const SUFFIX = 'sales-wf';

  beforeAll(async () => {
    app = await setupTestApp();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean any stale data from a previous run
    await cleanupDatabase(prisma, `test-org-${SUFFIX}`, `test-user-${SUFFIX}`);

    // Seed reference data
    org = await seedOrganization(prisma, SUFFIX);
    const userData = await seedUser(prisma, org.id, SUFFIX);
    user = userData.user;
    customer = await seedCustomer(prisma, org.id, SUFFIX);
    warehouse = await seedWarehouse(prisma, org.id, SUFFIX);
    items = await seedItems(prisma, org.id, 3, SUFFIX, {
      warehouseId: warehouse.id,
      stockQty: 200,
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

  /** Reset stock levels to original seeded values */
  async function resetStock() {
    for (const item of items) {
      await prisma.stockLevel.updateMany({
        where: { itemId: item.id, warehouseId: warehouse.id },
        data: { onHand: 200, committed: 0, onOrder: 0 },
      });
    }
    await prisma.stockMovement.deleteMany({
      where: { item: { organizationId: org.id } },
    });
  }

  // ---------------------------------------------------------------
  // 1. Create sales order
  // ---------------------------------------------------------------
  describe('Create sales order', () => {
    let orderId: string;

    afterAll(async () => {
      if (orderId) {
        await prisma.salesOrderLine.deleteMany({
          where: { salesOrderId: orderId },
        });
        await prisma.salesOrder.deleteMany({ where: { id: orderId } });
      }
    });

    it('should create a sales order in DRAFT status', async () => {
      const res = await auth(api().post('/api/v1/sales-orders'))
        .send({
          customerId: customer.id,
          warehouseId: warehouse.id,
          notes: 'E2E sales order',
          lines: [
            { itemId: items[0].id, quantity: 10 },
            { itemId: items[1].id, quantity: 5, unitPrice: 50 },
          ],
        })
        .expect(201);

      const order = res.body.data;
      orderId = order.id;

      expect(order.id).toBeDefined();
      expect(order.orderNumber).toBeDefined();
      expect(order.status).toBe('DRAFT');
      expect(order.customerId).toBe(customer.id);
      expect(order.lines).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------
  // 2. Full sales lifecycle: Confirm -> Pick -> Ship -> Invoice -> Pay
  // ---------------------------------------------------------------
  describe('Full sales lifecycle', () => {
    let orderId: string;
    let orderLines: any[];
    let pickListId: string;
    let pickListLines: any[];
    let shipmentId: string;
    let invoiceId: string;

    afterAll(async () => {
      // Delete in FK order
      await prisma.paymentAllocation.deleteMany({
        where: { paymentReceived: { organizationId: org.id } },
      });
      await prisma.paymentReceived.deleteMany({
        where: { organizationId: org.id },
      });
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { organizationId: org.id } },
      });
      await prisma.invoice.deleteMany({ where: { organizationId: org.id } });
      if (shipmentId) {
        await prisma.shipmentLine.deleteMany({
          where: { shipmentId },
        });
        await prisma.shipment.deleteMany({ where: { id: shipmentId } });
      }
      if (pickListId) {
        await prisma.pickListLine.deleteMany({
          where: { pickListId },
        });
        await prisma.pickList.deleteMany({ where: { id: pickListId } });
      }
      if (orderId) {
        await prisma.salesOrderLine.deleteMany({
          where: { salesOrderId: orderId },
        });
        await prisma.salesOrder.deleteMany({ where: { id: orderId } });
      }
      await resetStock();
    });

    it('Step 1: Create sales order', async () => {
      const res = await auth(api().post('/api/v1/sales-orders'))
        .send({
          customerId: customer.id,
          warehouseId: warehouse.id,
          lines: [
            { itemId: items[0].id, quantity: 10 },
            { itemId: items[1].id, quantity: 5 },
          ],
        })
        .expect(201);

      orderId = res.body.data.id;
      orderLines = res.body.data.lines;
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('Step 2: Confirm order (DRAFT -> CONFIRMED)', async () => {
      const res = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/confirm`),
      )
        .send({ warehouseId: warehouse.id })
        .expect(200);

      expect(res.body.data.status).toBe('CONFIRMED');

      // Verify stock committed
      const stockLevel = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouse.id },
      });
      expect(stockLevel?.committed).toBe(10);
    });

    it('Step 3: Create pick list', async () => {
      const res = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/pick-list`),
      ).expect(201);

      const pickList = res.body.data;
      pickListId = pickList.id;
      pickListLines = pickList.lines;

      expect(pickList.pickListNumber).toBeDefined();
      expect(pickList.salesOrderId).toBe(orderId);
      expect(pickList.lines.length).toBeGreaterThanOrEqual(1);
    });

    it('Step 4: Process pick list', async () => {
      const res = await auth(
        api().post(`/api/v1/pick-lists/${pickListId}/process`),
      )
        .send({
          lines: pickListLines.map((l: any) => ({
            lineId: l.id,
            quantityPicked: l.quantityToPick,
          })),
        })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('Step 5: Create shipment', async () => {
      const res = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/shipments`),
      )
        .send({
          carrier: 'E2E Logistics',
          trackingNumber: 'E2E-TRACK-001',
          lines: [
            { itemId: items[0].id, quantity: 10 },
            { itemId: items[1].id, quantity: 5 },
          ],
        })
        .expect(201);

      const shipment = res.body.data;
      shipmentId = shipment.id;

      expect(shipment.shipmentNumber).toBeDefined();
      expect(shipment.carrier).toBe('E2E Logistics');
      expect(shipment.trackingNumber).toBe('E2E-TRACK-001');
    });

    it('Step 6: Mark shipment as delivered', async () => {
      const res = await auth(
        api().post(`/api/v1/shipments/${shipmentId}/deliver`),
      ).expect(200);

      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.deliveredDate).toBeDefined();
    });

    it('Step 7: Generate invoice from order', async () => {
      const res = await auth(api().post('/api/v1/invoices/from-order'))
        .send({
          salesOrderId: orderId,
          paymentTerms: 30,
        })
        .expect(201);

      const invoice = res.body.data;
      invoiceId = invoice.id;

      expect(invoice.invoiceNumber).toBeDefined();
      expect(invoice.salesOrderId).toBe(orderId);
      expect(invoice.customerId).toBe(customer.id);
      expect(invoice.totalAmount).toBeGreaterThan(0);
    });

    it('Step 8: Record payment on invoice', async () => {
      // Fetch invoice for totalAmount
      const invoiceRes = await auth(
        api().get(`/api/v1/invoices/${invoiceId}`),
      ).expect(200);
      const totalAmount = invoiceRes.body.data.totalAmount;

      const res = await auth(
        api().post(`/api/v1/invoices/${invoiceId}/payments`),
      )
        .send({
          amount: totalAmount,
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: new Date().toISOString(),
          reference: 'PMT-E2E-001',
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.amount).toBe(totalAmount);

      // Invoice should now be PAID
      const paidInvoice = await auth(
        api().get(`/api/v1/invoices/${invoiceId}`),
      ).expect(200);

      expect(paidInvoice.body.data.status).toBe('PAID');
      expect(paidInvoice.body.data.balanceDue).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // 3. Sales return and credit note flow
  // ---------------------------------------------------------------
  describe('Sales return and credit note flow', () => {
    let orderId: string;
    let invoiceId: string;
    let returnId: string;
    let creditNoteId: string;

    afterAll(async () => {
      // Cleanup credit notes
      await prisma.creditNoteRefund.deleteMany({
        where: { creditNote: { organizationId: org.id } },
      });
      await prisma.creditNoteApplication.deleteMany({
        where: { creditNote: { organizationId: org.id } },
      });
      await prisma.creditNoteLine.deleteMany({
        where: { creditNote: { organizationId: org.id } },
      });
      await prisma.creditNote.deleteMany({
        where: { organizationId: org.id },
      });
      // Cleanup sales returns
      await prisma.salesReturnLine.deleteMany({
        where: { salesReturn: { organizationId: org.id } },
      });
      await prisma.salesReturn.deleteMany({
        where: { organizationId: org.id },
      });
      // Cleanup invoices/payments
      await prisma.paymentAllocation.deleteMany({
        where: { paymentReceived: { organizationId: org.id } },
      });
      await prisma.paymentReceived.deleteMany({
        where: { organizationId: org.id },
      });
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { organizationId: org.id } },
      });
      await prisma.invoice.deleteMany({
        where: { organizationId: org.id },
      });
      // Cleanup shipments, pick lists, orders
      await prisma.shipmentLine.deleteMany({
        where: { shipment: { salesOrder: { organizationId: org.id } } },
      });
      await prisma.shipment.deleteMany({
        where: { salesOrder: { organizationId: org.id } },
      });
      await prisma.pickListLine.deleteMany({
        where: { pickList: { salesOrder: { organizationId: org.id } } },
      });
      await prisma.pickList.deleteMany({
        where: { salesOrder: { organizationId: org.id } },
      });
      await prisma.salesOrderLine.deleteMany({
        where: { salesOrder: { organizationId: org.id } },
      });
      await prisma.salesOrder.deleteMany({
        where: { organizationId: org.id },
      });
      await resetStock();
    });

    it('Setup: Create confirmed order, ship, invoice, and pay', async () => {
      // Create order
      const createRes = await auth(api().post('/api/v1/sales-orders'))
        .send({
          customerId: customer.id,
          warehouseId: warehouse.id,
          lines: [{ itemId: items[0].id, quantity: 10 }],
        })
        .expect(201);
      orderId = createRes.body.data.id;

      // Confirm
      await auth(
        api().post(`/api/v1/sales-orders/${orderId}/confirm`),
      )
        .send({ warehouseId: warehouse.id })
        .expect(200);

      // Pick
      const pickRes = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/pick-list`),
      ).expect(201);
      const pickList = pickRes.body.data;

      await auth(
        api().post(`/api/v1/pick-lists/${pickList.id}/process`),
      )
        .send({
          lines: pickList.lines.map((l: any) => ({
            lineId: l.id,
            quantityPicked: l.quantityToPick,
          })),
        })
        .expect(200);

      // Ship
      const shipRes = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/shipments`),
      )
        .send({
          carrier: 'Return Test Carrier',
          lines: [{ itemId: items[0].id, quantity: 10 }],
        })
        .expect(201);

      await auth(
        api().post(`/api/v1/shipments/${shipRes.body.data.id}/deliver`),
      ).expect(200);

      // Invoice
      const invRes = await auth(api().post('/api/v1/invoices/from-order'))
        .send({ salesOrderId: orderId })
        .expect(201);
      invoiceId = invRes.body.data.id;

      // Pay full amount
      const totalAmount = invRes.body.data.totalAmount;
      await auth(
        api().post(`/api/v1/invoices/${invoiceId}/payments`),
      )
        .send({
          amount: totalAmount,
          paymentMethod: 'BANK_TRANSFER',
          paymentDate: new Date().toISOString(),
        })
        .expect(201);
    });

    it('Step 1: Create sales return', async () => {
      const res = await auth(api().post('/api/v1/sales-returns'))
        .send({
          invoiceId,
          reason: 'DEFECTIVE',
          notes: 'E2E return test',
          items: [
            {
              itemId: items[0].id,
              quantity: 3,
              reason: 'DEFECTIVE',
              notes: 'Damaged in transit',
            },
          ],
        })
        .expect(201);

      const ret = res.body.data;
      returnId = ret.id;

      expect(ret.id).toBeDefined();
      expect(ret.returnNumber || ret.id).toBeDefined();
    });

    it('Step 2: Approve the sales return', async () => {
      const res = await auth(
        api().post(`/api/v1/sales-returns/${returnId}/approve`),
      ).expect(200);

      expect(res.body.data.status).toBe('APPROVED');
    });

    it('Step 3: Receive returned items', async () => {
      const res = await auth(
        api().post(`/api/v1/sales-returns/${returnId}/receive`),
      )
        .send({
          warehouseId: warehouse.id,
          items: [
            {
              itemId: items[0].id,
              receivedQuantity: 3,
              condition: 'DAMAGED',
              restockable: false,
            },
          ],
        })
        .expect(200);

      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('Step 4: Create credit note from sales return', async () => {
      const res = await auth(
        api().post(`/api/v1/credit-notes/from-return/${returnId}`),
      ).expect(201);

      const cn = res.body.data;
      creditNoteId = cn.id;

      expect(cn.creditNoteNumber).toBeDefined();
      expect(cn.salesReturnId).toBe(returnId);
      expect(cn.customerId).toBe(customer.id);
      expect(cn.total).toBeGreaterThan(0);
    });

    it('Step 5: Issue credit note', async () => {
      const res = await auth(
        api().post(`/api/v1/credit-notes/${creditNoteId}/issue`),
      ).expect(200);

      expect(res.body.data.status).toBe('ISSUED');
    });

    it('Step 6: Refund credit note', async () => {
      // Fetch CN to know balance
      const cnRes = await auth(
        api().get(`/api/v1/credit-notes/${creditNoteId}`),
      ).expect(200);
      const balance = cnRes.body.data.balance;

      const res = await auth(
        api().post(`/api/v1/credit-notes/${creditNoteId}/refund`),
      )
        .send({
          amount: balance,
          refundMethod: 'BANK_TRANSFER',
          referenceNo: 'REF-E2E-001',
        })
        .expect(200);

      expect(res.body.data.refundedAmount).toBe(balance);
    });
  });

  // ---------------------------------------------------------------
  // 4. Cancel sales order
  // ---------------------------------------------------------------
  describe('Cancel sales order and release stock', () => {
    let orderId: string;

    afterAll(async () => {
      if (orderId) {
        await prisma.salesOrderLine.deleteMany({
          where: { salesOrderId: orderId },
        });
        await prisma.salesOrder.deleteMany({ where: { id: orderId } });
      }
      await resetStock();
    });

    it('should cancel a confirmed order and release committed stock', async () => {
      // Create
      const createRes = await auth(api().post('/api/v1/sales-orders'))
        .send({
          customerId: customer.id,
          warehouseId: warehouse.id,
          lines: [{ itemId: items[0].id, quantity: 15 }],
        })
        .expect(201);
      orderId = createRes.body.data.id;

      // Confirm (commits stock)
      await auth(
        api().post(`/api/v1/sales-orders/${orderId}/confirm`),
      )
        .send({ warehouseId: warehouse.id })
        .expect(200);

      const stockBefore = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouse.id },
      });
      expect(stockBefore?.committed).toBe(15);

      // Cancel
      const cancelRes = await auth(
        api().post(`/api/v1/sales-orders/${orderId}/cancel`),
      ).expect(200);

      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Stock committed should be released
      const stockAfter = await prisma.stockLevel.findFirst({
        where: { itemId: items[0].id, warehouseId: warehouse.id },
      });
      expect(stockAfter?.committed).toBe(0);
    });
  });

  // ---------------------------------------------------------------
  // 5. Validation
  // ---------------------------------------------------------------
  describe('Validation', () => {
    it('should reject order without customerId', async () => {
      await auth(api().post('/api/v1/sales-orders'))
        .send({ lines: [{ itemId: items[0].id, quantity: 1 }] })
        .expect(400);
    });

    it('should reject order without lines', async () => {
      await auth(api().post('/api/v1/sales-orders'))
        .send({ customerId: customer.id })
        .expect(400);
    });

    it('should require authentication', async () => {
      await api().get('/api/v1/sales-orders').expect(401);
    });
  });
});

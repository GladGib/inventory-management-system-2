import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';
import * as bcrypt from 'bcrypt';
import { ItemType } from '@prisma/client';

describe('Items (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Test data
  const testOrganization = {
    id: 'test-org-items',
    name: 'Test Organization Items',
    baseCurrency: 'MYR',
    country: 'Malaysia',
  };

  const testRole = {
    id: 'test-role-items',
    organizationId: 'test-org-items',
    name: 'Administrator',
    permissions: ['all'],
    isSystem: false,
  };

  const testUser = {
    id: 'test-user-items',
    organizationId: 'test-org-items',
    email: 'items.test@example.com',
    passwordHash: '',
    firstName: 'Items',
    lastName: 'Tester',
    roleId: 'test-role-items',
    isActive: true,
  };

  const testCategory = {
    id: 'test-category-items',
    organizationId: 'test-org-items',
    name: 'Test Category',
    description: 'Test category for items',
    level: 1,
  };

  const testTaxRate = {
    id: 'test-taxrate-items',
    organizationId: 'test-org-items',
    name: 'SST 10%',
    rate: 10.0,
    isActive: true,
  };

  const testItem = {
    id: 'test-item-1',
    organizationId: 'test-org-items',
    code: 'TEST-ITEM-001',
    name: 'Test Item 1',
    description: 'Test item description',
    type: ItemType.SIMPLE,
    categoryId: 'test-category-items',
    uom: 'pcs',
    barcode: '1234567890123',
    costPrice: 10.0,
    sellingPrice: 20.0,
    trackInventory: true,
    isActive: true,
  };

  const testItem2 = {
    id: 'test-item-2',
    organizationId: 'test-org-items',
    code: 'TEST-ITEM-002',
    name: 'Test Item 2',
    description: 'Another test item',
    type: ItemType.SIMPLE,
    categoryId: 'test-category-items',
    uom: 'box',
    costPrice: 50.0,
    sellingPrice: 100.0,
    trackInventory: true,
    isActive: true,
  };

  const inactiveItem = {
    id: 'test-item-inactive',
    organizationId: 'test-org-items',
    code: 'TEST-ITEM-INACTIVE',
    name: 'Inactive Item',
    type: ItemType.SIMPLE,
    uom: 'pcs',
    costPrice: 5.0,
    sellingPrice: 10.0,
    trackInventory: true,
    isActive: false,
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
    await prisma.category.create({ data: testCategory });
    await prisma.taxRate.create({ data: testTaxRate });
    await prisma.item.create({ data: testItem });
    await prisma.item.create({ data: testItem2 });
    await prisma.item.create({ data: inactiveItem });

    // Get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'password123' });
    accessToken = loginResponse.body.data.accessToken;
  });

  async function cleanupTestData() {
    await prisma.refreshToken.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.stockLevel.deleteMany({
      where: { item: { organizationId: testOrganization.id } },
    });
    await prisma.itemImage.deleteMany({
      where: { item: { organizationId: testOrganization.id } },
    });
    await prisma.item.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.category.deleteMany({
      where: { organizationId: testOrganization.id },
    });
    await prisma.taxRate.deleteMany({
      where: { organizationId: testOrganization.id },
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

  describe('GET /api/v1/items', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(401);
    });

    it('should return list of items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(1);
    });

    it('should support search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ search: 'Test Item 1' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const items = response.body.data;
      expect(items.some((i: any) => i.name === 'Test Item 1')).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ categoryId: testCategory.id })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((item: any) => {
        expect(item.categoryId).toBe(testCategory.id);
      });
    });

    it('should filter by isActive', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((item: any) => {
        expect(item.isActive).toBe(true);
      });
    });

    it('should filter by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/items')
        .query({ type: 'SIMPLE' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((item: any) => {
        expect(item.type).toBe('SIMPLE');
      });
    });
  });

  describe('GET /api/v1/items/:id', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/items/${testItem.id}`)
        .expect(401);
    });

    it('should return item by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/items/${testItem.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testItem.id);
      expect(response.body.data.code).toBe(testItem.code);
      expect(response.body.data.name).toBe(testItem.name);
      expect(response.body.data.description).toBe(testItem.description);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/items/barcode/:barcode', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/items/barcode/${testItem.barcode}`)
        .expect(401);
    });

    it('should return item by barcode', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/items/barcode/${testItem.barcode}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.barcode).toBe(testItem.barcode);
      expect(response.body.data.id).toBe(testItem.id);
    });

    it('should return 404 for non-existent barcode', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items/barcode/9999999999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/items', () => {
    const newItem = {
      name: 'New Created Item',
      uom: 'pcs',
      sellingPrice: 99.99,
    };

    afterEach(async () => {
      // Clean up created items
      await prisma.item.deleteMany({
        where: { name: newItem.name },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/items')
        .send(newItem)
        .expect(401);
    });

    it('should create a new item', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newItem)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe(newItem.name);
      expect(response.body.data.uom).toBe(newItem.uom);
      expect(Number(response.body.data.sellingPrice)).toBe(newItem.sellingPrice);
      expect(response.body.data.code).toBeDefined(); // Auto-generated code
    });

    it('should create item with all fields', async () => {
      const fullItem = {
        code: 'FULL-ITEM-001',
        name: 'Full Item',
        description: 'A complete item with all fields',
        type: 'SIMPLE',
        categoryId: testCategory.id,
        taxRateId: testTaxRate.id,
        uom: 'set',
        barcode: '9876543210987',
        costPrice: 100.0,
        sellingPrice: 200.0,
        wholesalePrice: 180.0,
        minSellingPrice: 150.0,
        trackInventory: true,
        reorderPoint: 10,
        reorderQty: 50,
        weight: 0.5,
        length: 20.0,
        width: 15.0,
        height: 5.0,
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(fullItem)
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.code).toBe(fullItem.code);
      expect(response.body.data.name).toBe(fullItem.name);
      expect(response.body.data.categoryId).toBe(fullItem.categoryId);

      // Clean up
      await prisma.item.delete({ where: { id: response.body.data.id } });
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'INCOMPLETE' })
        .expect(400);
    });

    it('should validate selling price is positive', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Invalid Price Item',
          uom: 'pcs',
          sellingPrice: -10,
        })
        .expect(400);
    });

    it('should validate item type enum', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Invalid Type Item',
          uom: 'pcs',
          sellingPrice: 10,
          type: 'INVALID_TYPE',
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/items/:id', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/items/${testItem.id}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('should update item', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/items/${testItem.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Test Item 1',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Updated Test Item 1');
      expect(response.body.data.description).toBe('Updated description');

      // Restore original data
      await prisma.item.update({
        where: { id: testItem.id },
        data: { name: testItem.name, description: testItem.description },
      });
    });

    it('should update item prices', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/items/${testItem.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          costPrice: 15.0,
          sellingPrice: 30.0,
          wholesalePrice: 25.0,
        })
        .expect(200);

      expect(Number(response.body.data.costPrice)).toBe(15.0);
      expect(Number(response.body.data.sellingPrice)).toBe(30.0);
      expect(Number(response.body.data.wholesalePrice)).toBe(25.0);

      // Restore original data
      await prisma.item.update({
        where: { id: testItem.id },
        data: {
          costPrice: testItem.costPrice,
          sellingPrice: testItem.sellingPrice,
          wholesalePrice: null,
        },
      });
    });

    it('should update item active status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/items/${testItem.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.data.isActive).toBe(false);

      // Restore original status
      await prisma.item.update({
        where: { id: testItem.id },
        data: { isActive: true },
      });
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/items/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should validate prices are positive', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/items/${testItem.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sellingPrice: -5 })
        .expect(400);
    });
  });

  describe('DELETE /api/v1/items/:id', () => {
    let itemToDelete: any;

    beforeEach(async () => {
      // Create an item to delete
      itemToDelete = await prisma.item.create({
        data: {
          id: 'item-to-delete-' + Date.now(),
          organizationId: testOrganization.id,
          code: 'DELETE-ME-' + Date.now(),
          name: 'Item to Delete',
          type: 'SIMPLE',
          uom: 'pcs',
          costPrice: 5.0,
          sellingPrice: 10.0,
          trackInventory: true,
          isActive: true,
        },
      });
    });

    afterEach(async () => {
      // Clean up in case test fails
      await prisma.item.deleteMany({
        where: { id: itemToDelete?.id },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/items/${itemToDelete.id}`)
        .expect(401);
    });

    it('should delete item', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/items/${itemToDelete.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.message).toBe('Item deleted successfully');

      // Verify item is deleted (soft or hard)
      const deletedItem = await prisma.item.findUnique({
        where: { id: itemToDelete.id },
      });
      expect(deletedItem === null || deletedItem.deletedAt !== null).toBe(true);
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/items/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/v1/items/:id/stock', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/items/${testItem.id}/stock`)
        .expect(401);
    });

    it('should return item stock levels', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/items/${testItem.id}/stock`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe(testItem.id);
      expect(response.body.data.itemCode).toBe(testItem.code);
      expect(response.body.data.itemName).toBe(testItem.name);
      expect(response.body.data.totalOnHand).toBeDefined();
      expect(response.body.data.totalCommitted).toBeDefined();
      expect(response.body.data.totalAvailable).toBeDefined();
    });

    it('should return 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items/non-existent-id/stock')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Categories', () => {
    describe('GET /api/v1/categories', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/categories')
          .expect(401);
      });

      it('should return list of categories', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/categories')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should return categories as tree structure', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/categories')
          .query({ tree: true })
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/v1/categories', () => {
      const newCategory = {
        name: 'New Test Category',
        description: 'A new test category',
      };

      afterEach(async () => {
        await prisma.category.deleteMany({
          where: { name: newCategory.name },
        });
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/categories')
          .send(newCategory)
          .expect(401);
      });

      it('should create a new category', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(newCategory)
          .expect(201);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.name).toBe(newCategory.name);
        expect(response.body.data.description).toBe(newCategory.description);
      });

      it('should create a subcategory with parent', async () => {
        const subcategory = {
          name: 'Subcategory',
          description: 'A subcategory',
          parentId: testCategory.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/categories')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(subcategory)
          .expect(201);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.parentId).toBe(testCategory.id);

        // Clean up
        await prisma.category.delete({ where: { id: response.body.data.id } });
      });
    });

    describe('PUT /api/v1/categories/:id', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .put(`/api/v1/categories/${testCategory.id}`)
          .send({ name: 'Updated Category' })
          .expect(401);
      });

      it('should update category', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/categories/${testCategory.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'Updated Test Category',
            description: 'Updated description',
          })
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.name).toBe('Updated Test Category');

        // Restore original data
        await prisma.category.update({
          where: { id: testCategory.id },
          data: { name: testCategory.name, description: testCategory.description },
        });
      });

      it('should return 404 for non-existent category', async () => {
        await request(app.getHttpServer())
          .put('/api/v1/categories/non-existent-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/v1/categories/:id', () => {
      let categoryToDelete: any;

      beforeEach(async () => {
        categoryToDelete = await prisma.category.create({
          data: {
            id: 'category-to-delete-' + Date.now(),
            organizationId: testOrganization.id,
            name: 'Category to Delete',
            level: 1,
          },
        });
      });

      afterEach(async () => {
        await prisma.category.deleteMany({
          where: { id: categoryToDelete?.id },
        });
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .delete(`/api/v1/categories/${categoryToDelete.id}`)
          .expect(401);
      });

      it('should delete category', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/categories/${categoryToDelete.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data.message).toBe('Category deleted successfully');
      });

      it('should return 404 for non-existent category', async () => {
        await request(app.getHttpServer())
          .delete('/api/v1/categories/non-existent-id')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });
  });

  describe('Variants', () => {
    let parentItem: any;

    beforeAll(async () => {
      // Create a parent item for variants
      parentItem = await prisma.item.create({
        data: {
          id: 'test-parent-item',
          organizationId: testOrganization.id,
          code: 'PARENT-ITEM-001',
          name: 'Parent Item',
          type: 'SIMPLE',
          uom: 'pcs',
          costPrice: 20.0,
          sellingPrice: 40.0,
          trackInventory: true,
          isActive: true,
        },
      });
    });

    afterAll(async () => {
      // Clean up variants first, then parent
      await prisma.item.deleteMany({
        where: { parentItemId: parentItem.id },
      });
      await prisma.item.delete({
        where: { id: parentItem.id },
      });
    });

    describe('POST /api/v1/items/:id/variants', () => {
      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .post(`/api/v1/items/${parentItem.id}/variants`)
          .send({
            attributes: [
              { name: 'Size', values: ['S', 'M', 'L'] },
            ],
          })
          .expect(401);
      });

      it('should create variants for an item', async () => {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/items/${parentItem.id}/variants`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            attributes: [
              { name: 'Size', values: ['S', 'M', 'L'] },
            ],
          })
          .expect(201);

        expect(response.body.data).toBeDefined();
        // Parent item should now be VARIANT_PARENT type
        expect(response.body.data.type).toBe('VARIANT_PARENT');
        expect(response.body.data.variants).toBeDefined();
        expect(response.body.data.variants.length).toBe(3); // S, M, L

        // Clean up variants for next test
        await prisma.item.deleteMany({
          where: { parentItemId: parentItem.id },
        });
        // Reset parent type
        await prisma.item.update({
          where: { id: parentItem.id },
          data: { type: 'SIMPLE' },
        });
      });
    });

    describe('GET /api/v1/items/:id/variants', () => {
      beforeAll(async () => {
        // Create variants for testing
        await prisma.item.update({
          where: { id: parentItem.id },
          data: { type: 'VARIANT_PARENT' },
        });
        await prisma.item.create({
          data: {
            id: 'variant-s',
            organizationId: testOrganization.id,
            code: 'PARENT-ITEM-001-S',
            name: 'Parent Item - S',
            type: 'VARIANT',
            parentItemId: parentItem.id,
            uom: 'pcs',
            costPrice: 20.0,
            sellingPrice: 40.0,
            trackInventory: true,
            isActive: true,
          },
        });
        await prisma.item.create({
          data: {
            id: 'variant-m',
            organizationId: testOrganization.id,
            code: 'PARENT-ITEM-001-M',
            name: 'Parent Item - M',
            type: 'VARIANT',
            parentItemId: parentItem.id,
            uom: 'pcs',
            costPrice: 20.0,
            sellingPrice: 40.0,
            trackInventory: true,
            isActive: true,
          },
        });
      });

      afterAll(async () => {
        await prisma.item.deleteMany({
          where: { parentItemId: parentItem.id },
        });
        await prisma.item.update({
          where: { id: parentItem.id },
          data: { type: 'SIMPLE' },
        });
      });

      it('should require authentication', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/items/${parentItem.id}/variants`)
          .expect(401);
      });

      it('should return item with variants', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/items/${parentItem.id}/variants`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.data.id).toBe(parentItem.id);
        expect(response.body.data.variants).toBeDefined();
        expect(Array.isArray(response.body.data.variants)).toBe(true);
        expect(response.body.data.variants.length).toBe(2);
      });
    });
  });

  describe('Token Validation', () => {
    it('should reject requests without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/items')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
});

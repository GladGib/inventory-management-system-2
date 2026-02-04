import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';
import * as bcrypt from 'bcrypt';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminAccessToken: string;
  let managerAccessToken: string;
  let salesAccessToken: string;

  // Test data
  const testOrganization = {
    id: 'test-org-users',
    name: 'Test Organization Users',
    baseCurrency: 'MYR',
    country: 'Malaysia',
  };

  const adminRole = {
    id: 'test-role-admin-users',
    organizationId: 'test-org-users',
    name: 'Administrator',
    permissions: ['all'],
    isSystem: false,
  };

  const managerRole = {
    id: 'test-role-manager-users',
    organizationId: 'test-org-users',
    name: 'Manager',
    permissions: ['users:read', 'users:write'],
    isSystem: false,
  };

  const salesRole = {
    id: 'test-role-sales-users',
    organizationId: 'test-org-users',
    name: 'Sales',
    permissions: ['sales:read', 'sales:write'],
    isSystem: false,
  };

  const adminUser = {
    id: 'test-admin-users',
    organizationId: 'test-org-users',
    email: 'admin.users@example.com',
    passwordHash: '',
    firstName: 'Admin',
    lastName: 'User',
    roleId: 'test-role-admin-users',
    isActive: true,
  };

  const managerUser = {
    id: 'test-manager-users',
    organizationId: 'test-org-users',
    email: 'manager.users@example.com',
    passwordHash: '',
    firstName: 'Manager',
    lastName: 'User',
    roleId: 'test-role-manager-users',
    isActive: true,
  };

  const salesUser = {
    id: 'test-sales-users',
    organizationId: 'test-org-users',
    email: 'sales.users@example.com',
    passwordHash: '',
    firstName: 'Sales',
    lastName: 'User',
    roleId: 'test-role-sales-users',
    isActive: true,
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

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    adminUser.passwordHash = hashedPassword;
    managerUser.passwordHash = hashedPassword;
    salesUser.passwordHash = hashedPassword;

    // Clean up any existing test data
    await cleanupTestData();

    // Create test data
    await prisma.organization.create({ data: testOrganization });
    await prisma.role.create({ data: adminRole });
    await prisma.role.create({ data: managerRole });
    await prisma.role.create({ data: salesRole });
    await prisma.user.create({ data: adminUser });
    await prisma.user.create({ data: managerUser });
    await prisma.user.create({ data: salesUser });

    // Get access tokens for different roles
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'password123' });
    adminAccessToken = adminLogin.body.data.accessToken;

    const managerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: managerUser.email, password: 'password123' });
    managerAccessToken = managerLogin.body.data.accessToken;

    const salesLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: salesUser.email, password: 'password123' });
    salesAccessToken = salesLogin.body.data.accessToken;
  });

  async function cleanupTestData() {
    const userIds = [adminUser.id, managerUser.id, salesUser.id];

    await prisma.refreshToken.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: { in: userIds } },
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

  describe('GET /api/v1/users', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);
    });

    it('should return list of users for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
    });

    it('should support search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ search: 'Admin' })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      const users = response.body.data;
      const hasAdminUser = users.some(
        (u: any) => u.firstName === 'Admin' || u.lastName === 'Admin',
      );
      expect(hasAdminUser).toBe(true);
    });

    it('should filter by roleId', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ roleId: adminRole.id })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((user: any) => {
        expect(user.roleId).toBe(adminRole.id);
      });
    });

    it('should filter by isActive', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ isActive: true })
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((user: any) => {
        expect(user.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(adminUser.email);
      expect(response.body.data.firstName).toBe(adminUser.firstName);
      expect(response.body.data.lastName).toBe(adminUser.lastName);
    });
  });

  describe('PUT /api/v1/users/me', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .send({ firstName: 'Updated' })
        .expect(401);
    });

    it('should update current user profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({
          firstName: 'UpdatedSales',
          phone: '+60 12-345 9999',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe('UpdatedSales');
      expect(response.body.data.phone).toBe('+60 12-345 9999');

      // Restore original data
      await prisma.user.update({
        where: { id: salesUser.id },
        data: { firstName: salesUser.firstName, phone: null },
      });
    });
  });

  describe('POST /api/v1/users/me/change-password', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/me/change-password')
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(401);
    });

    it('should change password with correct current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/change-password')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.data.message).toBe('Password changed successfully');

      // Verify new password works
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: salesUser.email, password: 'newpassword123' })
        .expect(200);

      // Restore original password
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { id: salesUser.id },
        data: { passwordHash: hashedPassword },
      });
    });

    it('should reject with incorrect current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users/me/change-password')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/v1/users/roles', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/roles')
        .expect(401);
    });

    it('should return available roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/roles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${managerUser.id}`)
        .expect(401);
    });

    it('should return user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${managerUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(managerUser.id);
      expect(response.body.data.email).toBe(managerUser.email);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/users', () => {
    const newUser = {
      email: 'newuser@example.com',
      firstName: 'New',
      lastName: 'User',
      roleId: '', // Will be set in test
    };

    afterEach(async () => {
      // Clean up created user
      await prisma.user.deleteMany({
        where: { email: newUser.email },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ ...newUser, roleId: salesRole.id })
        .expect(401);
    });

    it('should allow Administrator to create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ...newUser, roleId: salesRole.id })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.firstName).toBe(newUser.firstName);
      expect(response.body.data.lastName).toBe(newUser.lastName);
    });

    it('should allow Manager to create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ ...newUser, roleId: salesRole.id })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(newUser.email);
    });

    it('should forbid Sales role from creating user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({ ...newUser, roleId: salesRole.id })
        .expect(403);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: 'incomplete@example.com' })
        .expect(400);
    });

    it('should validate email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          email: 'not-an-email',
          firstName: 'Test',
          lastName: 'User',
          roleId: salesRole.id,
        })
        .expect(400);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/users/${salesUser.id}`)
        .send({ firstName: 'Updated' })
        .expect(401);
    });

    it('should allow Administrator to update user', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ firstName: 'UpdatedBySuperAdmin' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe('UpdatedBySuperAdmin');

      // Restore original data
      await prisma.user.update({
        where: { id: salesUser.id },
        data: { firstName: salesUser.firstName },
      });
    });

    it('should allow Manager to update user', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .send({ firstName: 'UpdatedByManager' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.firstName).toBe('UpdatedByManager');

      // Restore original data
      await prisma.user.update({
        where: { id: salesUser.id },
        data: { firstName: salesUser.firstName },
      });
    });

    it('should forbid Sales role from updating other users', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/users/${managerUser.id}`)
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({ firstName: 'UpdatedBySales' })
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ firstName: 'Updated' })
        .expect(404);
    });

    it('should update user active status', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.data.isActive).toBe(false);

      // Restore original status
      await prisma.user.update({
        where: { id: salesUser.id },
        data: { isActive: true },
      });
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    let userToDelete: any;

    beforeEach(async () => {
      // Create a user to delete
      const hashedPassword = await bcrypt.hash('password123', 10);
      userToDelete = await prisma.user.create({
        data: {
          id: 'user-to-delete-' + Date.now(),
          organizationId: testOrganization.id,
          email: 'todelete@example.com',
          passwordHash: hashedPassword,
          firstName: 'ToDelete',
          lastName: 'User',
          roleId: salesRole.id,
          isActive: true,
        },
      });
    });

    afterEach(async () => {
      // Clean up in case test fails
      await prisma.user.deleteMany({
        where: { email: 'todelete@example.com' },
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userToDelete.id}`)
        .expect(401);
    });

    it('should allow Administrator to delete user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body.data.message).toBe('User deleted successfully');

      // Verify user is deleted (soft or hard)
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      // If soft delete, check deletedAt; if hard delete, check null
      expect(deletedUser === null || deletedUser.deletedAt !== null).toBe(true);
    });

    it('should forbid Manager from deleting user', async () => {
      // Recreate user for this test
      const hashedPassword = await bcrypt.hash('password123', 10);
      const anotherUser = await prisma.user.create({
        data: {
          id: 'another-user-to-delete',
          organizationId: testOrganization.id,
          email: 'anothertodelete@example.com',
          passwordHash: hashedPassword,
          firstName: 'AnotherToDelete',
          lastName: 'User',
          roleId: salesRole.id,
          isActive: true,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/v1/users/${anotherUser.id}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(403);

      // Clean up
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    it('should forbid Sales role from deleting user', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/users/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('Role-Based Access Control', () => {
    it('Administrator should have access to all user operations', async () => {
      // List users
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // Get specific user
      await request(app.getHttpServer())
        .get(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      // Get roles
      await request(app.getHttpServer())
        .get('/api/v1/users/roles')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);
    });

    it('Manager should have limited access', async () => {
      // Can list users
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      // Can view user
      await request(app.getHttpServer())
        .get(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(200);

      // Cannot delete user
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${salesUser.id}`)
        .set('Authorization', `Bearer ${managerAccessToken}`)
        .expect(403);
    });

    it('Sales should have minimal access', async () => {
      // Can list users
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .expect(200);

      // Can view own profile
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .expect(200);

      // Cannot create user
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({
          email: 'forbidden@example.com',
          firstName: 'Forbidden',
          lastName: 'User',
          roleId: salesRole.id,
        })
        .expect(403);

      // Cannot update other users
      await request(app.getHttpServer())
        .put(`/api/v1/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);

      // Cannot delete user
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${managerUser.id}`)
        .set('Authorization', `Bearer ${salesAccessToken}`)
        .expect(403);
    });
  });
});

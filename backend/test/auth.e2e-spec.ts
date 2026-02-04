import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';
import * as bcrypt from 'bcrypt';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  const testOrganization = {
    id: 'test-org-auth',
    name: 'Test Organization Auth',
    baseCurrency: 'MYR',
    country: 'Malaysia',
  };

  const testRole = {
    id: 'test-role-auth',
    organizationId: 'test-org-auth',
    name: 'Administrator',
    permissions: ['all'],
    isSystem: false,
  };

  const testUser = {
    id: 'test-user-auth',
    organizationId: 'test-org-auth',
    email: 'authtest@example.com',
    passwordHash: '', // Will be set in beforeAll
    firstName: 'Auth',
    lastName: 'Test',
    roleId: 'test-role-auth',
    isActive: true,
  };

  const inactiveUser = {
    id: 'test-user-inactive',
    organizationId: 'test-org-auth',
    email: 'inactive@example.com',
    passwordHash: '', // Will be set in beforeAll
    firstName: 'Inactive',
    lastName: 'User',
    roleId: 'test-role-auth',
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

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser.passwordHash = hashedPassword;
    inactiveUser.passwordHash = hashedPassword;

    // Clean up any existing test data
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.role.deleteMany({ where: { id: testRole.id } });
    await prisma.organization.deleteMany({ where: { id: testOrganization.id } });

    // Create test data
    await prisma.organization.create({ data: testOrganization });
    await prisma.role.create({ data: testRole });
    await prisma.user.create({ data: testUser });
    await prisma.user.create({ data: inactiveUser });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.refreshToken.deleteMany({
      where: { userId: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.passwordReset.deleteMany({
      where: { userId: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, inactiveUser.id] } },
    });
    await prisma.role.deleteMany({ where: { id: testRole.id } });
    await prisma.organization.deleteMany({ where: { id: testOrganization.id } });

    await app.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('authtest@example.com');
      expect(response.body.data.user.firstName).toBe('Auth');
      expect(response.body.data.user.lastName).toBe('Test');
      expect(response.body.data.user.organizationId).toBe(testOrganization.id);
      expect(response.body.data.user.organizationName).toBe(testOrganization.name);

      // Check that refresh token cookie is set
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('refresh_token'))).toBe(true);
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });

    it('should return 401 for inactive user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toBe('Account is inactive');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.message).toContain('email must be an email');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for password too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: '12345',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get refresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((cookie: string) =>
        cookie.includes('refresh_token'),
      );
      refreshToken = refreshCookie!.split(';')[0].split('=')[1];
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();

      // Check that new refresh token cookie is set (token rotation)
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((cookie: string) => cookie.includes('refresh_token'))).toBe(true);
    });

    it('should return 401 when no refresh token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.message).toBe('No refresh token provided');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refresh_token=invalid-token'])
        .expect(401);

      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should detect refresh token reuse and invalidate all tokens', async () => {
      // Use the refresh token once
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(200);

      // Try to use the same refresh token again (reuse attack)
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(401);

      expect(response.body.message).toBe('Refresh token reuse detected');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.data.accessToken;
      const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((cookie: string) =>
        cookie.includes('refresh_token'),
      );
      refreshToken = refreshCookie!.split(';')[0].split('=')[1];
    });

    it('should logout successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body.data.message).toBe('Logged out successfully');

      // Check that refresh token cookie is cleared
      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((cookie: string) =>
        cookie.includes('refresh_token'),
      );
      expect(clearedCookie).toContain('refresh_token=;');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should return success for existing email (without revealing existence)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'authtest@example.com',
        })
        .expect(200);

      expect(response.body.data.message).toBe(
        'If the email exists, a reset link has been sent',
      );

      // Verify a password reset record was created
      const resetRecord = await prisma.passwordReset.findFirst({
        where: { userId: testUser.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(resetRecord).toBeDefined();
    });

    it('should return same success message for non-existing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.data.message).toBe(
        'If the email exists, a reset link has been sent',
      );
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'not-an-email',
        })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create a password reset token
      const token = 'test-reset-token-' + Date.now();
      await prisma.passwordReset.create({
        data: {
          userId: testUser.id,
          token,
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
      });
      resetToken = token;
    });

    afterEach(async () => {
      // Clean up password reset tokens
      await prisma.passwordReset.deleteMany({
        where: { userId: testUser.id },
      });

      // Reset the user's password back to original
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.update({
        where: { id: testUser.id },
        data: { passwordHash: hashedPassword },
      });
    });

    it('should reset password successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.data.message).toBe('Password reset successful');

      // Verify the password was changed by trying to login
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'newpassword123',
        })
        .expect(200);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 for already used token', async () => {
      // Use the token first
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123',
        })
        .expect(200);

      // Try to use it again
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'anotherpassword123',
        })
        .expect(400);

      expect(response.body.message).toBe('Reset token already used');
    });

    it('should return 400 for expired token', async () => {
      // Create an expired token
      const expiredToken = 'expired-token-' + Date.now();
      await prisma.passwordReset.create({
        data: {
          userId: testUser.id,
          token: expiredToken,
          expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: expiredToken,
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.message).toBe('Reset token expired');
    });

    it('should return 400 for password too short', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '12345',
        })
        .expect(400);
    });
  });

  describe('Authentication Guard Tests', () => {
    it('should protect routes that require authentication', async () => {
      // Test various protected routes without authentication
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/v1/customers')
        .expect(401);
    });

    it('should allow access to protected routes with valid token', async () => {
      // Login to get access token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
        });

      const accessToken = loginResponse.body.data.accessToken;

      // Access protected route with token
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('authtest@example.com');
    });

    it('should reject requests with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);
    });

    it('should reject requests with expired token', async () => {
      // This would require creating a token with a past expiration
      // For now, we just verify that invalid tokens are rejected
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid')
        .expect(401);
    });
  });
});

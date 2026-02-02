import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/api/v1/auth/login (POST) - should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'invalid@test.com', password: 'wrong' })
        .expect(401);
    });

    it('/api/v1/auth/login (POST) - should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('Protected Routes', () => {
    it('/api/v1/items (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/items')
        .expect(401);
    });

    it('/api/v1/customers (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .expect(401);
    });

    it('/api/v1/reports/sales-summary (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/sales-summary')
        .expect(401);
    });

    it('/api/v1/bills (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bills')
        .expect(401);
    });

    it('/api/v1/sales-returns (GET) - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/sales-returns')
        .expect(401);
    });
  });

  describe('Swagger Documentation', () => {
    it('/api/docs (GET) - should serve swagger docs', () => {
      return request(app.getHttpServer())
        .get('/api/docs')
        .expect(301); // Redirects to /api/docs/
    });
  });
});

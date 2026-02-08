/**
 * Generate openapi.json from the NestJS Swagger decorators.
 *
 * Uses tsconfig-paths to resolve @/ path aliases at runtime.
 * Run: npm run openapi:generate
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('IMS API')
    .setDescription('Inventory Management System API for Malaysian SMEs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(__dirname, '../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log('OpenAPI spec written to openapi.json');

  await app.close();
}

generate();

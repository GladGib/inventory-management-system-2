import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { PdfModule } from './common/pdf/pdf.module';
import { UploadsModule } from './common/uploads/uploads.module';
import { BulkOperationsModule } from './common/bulk-operations/bulk-operations.module';
import { EmailModule } from './common/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ItemsModule } from './modules/items/items.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { SalesModule } from './modules/sales/sales.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesReturnsModule } from './modules/sales-returns/sales-returns.module';
import { CreditNotesModule } from './modules/credit-notes/credit-notes.module';
import { BillsModule } from './modules/bills/bills.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    PdfModule,
    UploadsModule,
    BulkOperationsModule,
    EmailModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ItemsModule,
    CustomersModule,
    VendorsModule,
    WarehousesModule,
    SalesModule,
    InvoicesModule,
    PurchasesModule,
    InventoryModule,
    SalesReturnsModule,
    CreditNotesModule,
    BillsModule,
    ReportsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply JwtAuthGuard globally - use @Public() to skip auth
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

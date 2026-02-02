import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { PdfModule } from './common/pdf/pdf.module';
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
import { BillsModule } from './modules/bills/bills.module';
import { ReportsModule } from './modules/reports/reports.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    PdfModule,
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
    BillsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [
    // Apply JwtAuthGuard globally - use @Public() to skip auth
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

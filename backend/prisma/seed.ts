import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default organization
  const organization = await prisma.organization.upsert({
    where: { id: 'org_default' },
    update: {},
    create: {
      id: 'org_default',
      name: 'Demo Auto Parts Sdn Bhd',
      email: 'info@demoautoparts.com',
      phone: '+60 3-1234 5678',
      address: '123 Jalan Industri',
      city: 'Petaling Jaya',
      state: 'Selangor',
      postalCode: '47301',
      country: 'Malaysia',
      taxRegistrationNo: 'SST-123456-X',
      baseCurrency: 'MYR',
      fiscalYearStart: 1,
    },
  });

  console.log('Created organization:', organization.name);

  // Create predefined roles
  const roles = [
    {
      id: 'role_admin',
      name: 'Administrator',
      description: 'Full access to all features',
      permissions: ['*'],
      isSystem: true,
    },
    {
      id: 'role_manager',
      name: 'Manager',
      description: 'Access to all operational features',
      permissions: [
        'items:*',
        'customers:*',
        'vendors:*',
        'warehouses:*',
        'sales:*',
        'purchases:*',
        'inventory:*',
        'reports:*',
      ],
      isSystem: true,
    },
    {
      id: 'role_sales',
      name: 'Sales Staff',
      description: 'Access to sales functions only',
      permissions: [
        'items:view',
        'customers:*',
        'sales:*',
        'reports:sales',
      ],
      isSystem: true,
    },
    {
      id: 'role_purchasing',
      name: 'Purchasing Staff',
      description: 'Access to purchase functions only',
      permissions: [
        'items:view',
        'vendors:*',
        'purchases:*',
        'reports:purchases',
      ],
      isSystem: true,
    },
    {
      id: 'role_warehouse',
      name: 'Warehouse Staff',
      description: 'Access to inventory operations only',
      permissions: [
        'items:view',
        'warehouses:view',
        'inventory:*',
        'sales:pick',
        'purchases:receive',
      ],
      isSystem: true,
    },
    {
      id: 'role_accountant',
      name: 'Accountant',
      description: 'Access to financial transactions only',
      permissions: [
        'sales:invoice',
        'sales:payment',
        'purchases:bill',
        'purchases:payment',
        'reports:*',
      ],
      isSystem: true,
    },
    {
      id: 'role_viewer',
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [
        'items:view',
        'customers:view',
        'vendors:view',
        'warehouses:view',
        'sales:view',
        'purchases:view',
        'inventory:view',
        'reports:view',
      ],
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  console.log('Created predefined roles');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'admin@demoautoparts.com',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      email: 'admin@demoautoparts.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      roleId: 'role_admin',
      isActive: true,
    },
  });

  console.log('Created admin user:', adminUser.email);

  // Create tax rates
  const taxRates = [
    { id: 'tax_sst_10', name: 'SST 10%', rate: 10 },
    { id: 'tax_sst_5', name: 'SST 5%', rate: 5 },
    { id: 'tax_exempt', name: 'Tax Exempt', rate: 0 },
  ];

  for (const tax of taxRates) {
    await prisma.taxRate.upsert({
      where: { id: tax.id },
      update: {},
      create: {
        id: tax.id,
        organizationId: organization.id,
        name: tax.name,
        rate: tax.rate,
        isActive: true,
      },
    });
  }

  console.log('Created tax rates');

  // Create number sequences
  const sequences = [
    { documentType: 'SO', prefix: 'SO' },
    { documentType: 'INV', prefix: 'INV' },
    { documentType: 'CN', prefix: 'CN' },
    { documentType: 'PO', prefix: 'PO' },
    { documentType: 'GRN', prefix: 'GRN' },
    { documentType: 'BILL', prefix: 'BILL' },
    { documentType: 'ADJ', prefix: 'ADJ' },
    { documentType: 'TRF', prefix: 'TRF' },
    { documentType: 'COUNT', prefix: 'COUNT' },
    { documentType: 'PAY', prefix: 'PAY' },
  ];

  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: {
        organizationId_documentType: {
          organizationId: organization.id,
          documentType: seq.documentType,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        documentType: seq.documentType,
        prefix: seq.prefix,
        currentNumber: 0,
        resetMonthly: true,
      },
    });
  }

  console.log('Created number sequences');

  // Create primary warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'WH-MAIN',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      address: '123 Jalan Industri',
      city: 'Petaling Jaya',
      state: 'Selangor',
      postalCode: '47301',
      contactPerson: 'Ahmad',
      phone: '+60 3-1234 5679',
      isPrimary: true,
      isActive: true,
    },
  });

  console.log('Created warehouse:', warehouse.name);

  // Create sample bin locations
  const bins = ['A-01-01', 'A-01-02', 'A-02-01', 'A-02-02', 'B-01-01', 'B-01-02'];
  for (const code of bins) {
    await prisma.binLocation.upsert({
      where: {
        warehouseId_code: {
          warehouseId: warehouse.id,
          code,
        },
      },
      update: {},
      create: {
        warehouseId: warehouse.id,
        code,
        zone: code.split('-')[0],
        aisle: code.split('-')[1],
        rack: code.split('-')[2],
        isActive: true,
      },
    });
  }

  console.log('Created bin locations');

  // Create sample categories
  const categories = [
    { code: 'ENGINE', name: 'Engine Parts' },
    { code: 'BRAKE', name: 'Brake System' },
    { code: 'SUSPENSION', name: 'Suspension' },
    { code: 'ELECTRICAL', name: 'Electrical' },
    { code: 'FILTERS', name: 'Filters' },
    { code: 'FLUIDS', name: 'Fluids & Chemicals' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: `cat_${cat.code.toLowerCase()}` },
      update: {},
      create: {
        id: `cat_${cat.code.toLowerCase()}`,
        organizationId: organization.id,
        name: cat.name,
        level: 1,
      },
    });
  }

  console.log('Created categories');

  // Create sample items
  const items = [
    {
      code: 'BP-001',
      name: 'Brake Pad Set - Front',
      categoryId: 'cat_brake',
      costPrice: 45.00,
      sellingPrice: 89.00,
      uom: 'set',
    },
    {
      code: 'BP-002',
      name: 'Brake Pad Set - Rear',
      categoryId: 'cat_brake',
      costPrice: 40.00,
      sellingPrice: 79.00,
      uom: 'set',
    },
    {
      code: 'OF-001',
      name: 'Oil Filter - Universal',
      categoryId: 'cat_filters',
      costPrice: 8.00,
      sellingPrice: 18.00,
      uom: 'pcs',
    },
    {
      code: 'AF-001',
      name: 'Air Filter - Standard',
      categoryId: 'cat_filters',
      costPrice: 12.00,
      sellingPrice: 28.00,
      uom: 'pcs',
    },
    {
      code: 'EO-001',
      name: 'Engine Oil 5W-40 4L',
      categoryId: 'cat_fluids',
      costPrice: 65.00,
      sellingPrice: 95.00,
      uom: 'bottle',
    },
  ];

  for (const item of items) {
    const created = await prisma.item.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: item.code,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        code: item.code,
        name: item.name,
        categoryId: item.categoryId,
        taxRateId: 'tax_sst_10',
        uom: item.uom,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        trackInventory: true,
        reorderPoint: 10,
        reorderQty: 50,
        isActive: true,
      },
    });

    // Create initial stock level
    const existingStock = await prisma.stockLevel.findFirst({
      where: {
        itemId: created.id,
        warehouseId: warehouse.id,
        binLocationId: null,
      },
    });

    if (!existingStock) {
      await prisma.stockLevel.create({
        data: {
          itemId: created.id,
          warehouseId: warehouse.id,
          onHand: 100,
          committed: 0,
          onOrder: 0,
        },
      });
    }
  }

  console.log('Created sample items with stock');

  // Create sample customer
  await prisma.customer.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'CUST-001',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'CUST-001',
      companyName: 'ABC Auto Workshop',
      contactPerson: 'Ali bin Ahmad',
      email: 'ali@abcauto.com',
      phone: '+60 12-345 6789',
      paymentTerms: 'Net 30',
      creditLimit: 50000,
      customerGroup: 'Wholesale',
      isActive: true,
    },
  });

  console.log('Created sample customer');

  // Create sample vendor
  await prisma.vendor.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'VEND-001',
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      code: 'VEND-001',
      companyName: 'XYZ Auto Parts Supplier',
      contactPerson: 'Tan Ah Kow',
      email: 'sales@xyzparts.com',
      phone: '+60 3-9876 5432',
      paymentTerms: 'Net 60',
      currency: 'MYR',
      isActive: true,
    },
  });

  console.log('Created sample vendor');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

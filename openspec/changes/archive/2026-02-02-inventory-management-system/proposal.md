## Why

Malaysian SMEs in the auto parts, hardware, and spare parts wholesale market lack affordable, localized inventory management solutions. Existing options like Zoho Inventory are either too expensive, lack Malaysian tax compliance (GST/SST), or don't support the specific workflows of B2B wholesalers (credit terms, cross-reference lookups, barcode-driven warehouse operations). This system will provide a purpose-built solution with the right feature set for this market segment.

## What Changes

This is a greenfield implementation of a full Inventory Management System (MVP - Phase 1):

**Backend (NestJS + PostgreSQL + Prisma)**
- Complete REST API with OpenAPI/Swagger documentation
- JWT-based authentication with role-based access control
- Multi-tenant organization support
- All core business logic for inventory, sales, and purchasing

**Web Application (Next.js + Ant Design)**
- Responsive dashboard with key business metrics
- Full CRUD interfaces for all entities
- Transaction workflows (sales orders, purchase orders, invoicing)
- Reporting module with exportable reports

**Mobile Application (Flutter)**
- Warehouse operations: picking, receiving, stock counts
- Barcode scanning for all operations
- Offline-first with background sync

## Capabilities

### New Capabilities

- `auth`: User authentication (login, logout, password reset) and JWT token management
- `organization`: Organization profile, settings, tax configuration, and number sequences
- `user-management`: User CRUD, role assignment, and permission management with predefined roles
- `item-management`: Items (simple & variants), categories (hierarchical), SKU/barcode generation, and stock tracking settings
- `customer-management`: Customer profiles, addresses, credit limits, payment terms, and transaction history
- `vendor-management`: Vendor profiles, addresses, payment terms, and preferred items
- `warehouse-management`: Warehouse CRUD, bin/location management, and stock-by-location tracking
- `sales-orders`: Sales order lifecycle (draft to shipped), line items, stock allocation, and pick list generation
- `invoicing`: Invoice generation from sales orders, tax calculation (GST/SST), payment recording, and receipts
- `sales-returns`: Return authorization, credit note generation, and stock adjustment
- `purchase-orders`: Purchase order lifecycle (draft to closed), vendor selection, and email/PDF generation
- `goods-receiving`: GRN creation against POs, partial receiving, bin allocation, and discrepancy handling
- `purchase-bills`: Bill creation from GRN, bill-to-PO matching, and payment tracking
- `stock-management`: Stock adjustments (write-off, write-in, opening), stock counts, and variance reporting
- `reporting`: Stock summary, sales summary, purchase summary, receivables aging, and payables aging reports
- `mobile-warehouse`: Flutter mobile app for picking, receiving, stock lookup, and barcode scanning

### Modified Capabilities

(None - this is a greenfield project)

## Impact

**New Codebase Structure:**
```
/backend          - NestJS application
  /src
    /modules      - Feature modules (auth, items, sales, etc.)
    /common       - Shared utilities, guards, decorators
    /prisma       - Database schema and migrations
/web              - Next.js application
  /src
    /app          - App router pages
    /components   - Reusable UI components
    /hooks        - TanStack Query hooks
    /lib          - API client, utilities
/mobile           - Flutter application
  /lib
    /features     - Feature modules
    /core         - Shared services, models
```

**Database:**
- PostgreSQL with ~30 tables (see SPECS.md Section 5 for entity model)
- Prisma ORM for type-safe database access

**External Dependencies:**
- PostgreSQL 15+
- Node.js 20+ / npm
- Flutter 3.x
- Docker for local development

**APIs:**
- RESTful API with OpenAPI 3.0 specification
- ~50 endpoints across all modules (see SPECS.md Section 7)

**Deployment Targets:**
- Backend: Docker container (cloud-agnostic)
- Web: Vercel or static hosting
- Mobile: iOS App Store, Google Play Store

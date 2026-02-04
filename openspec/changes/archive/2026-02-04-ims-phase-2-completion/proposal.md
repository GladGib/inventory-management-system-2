## Why

The IMS MVP implementation is 36% complete with 75 remaining tasks. Critical business workflows are incomplete: goods receiving forms lack quantity entry, bills cannot be created from GRNs, sales returns cannot be created from invoices, and stock count data entry is missing. Additionally, the system lacks file upload capabilities, bulk import/export, email notifications, and deployment infrastructure needed for production readiness.

## What Changes

### Backend Enhancements
- Add file upload infrastructure for organization logos and item images
- Implement bulk import/export for items, customers, vendors (CSV) and reports (Excel)
- Add item variants management for products with size/color/style options
- Implement shipment creation and delivery order PDF generation
- Add credit note generation and application for sales returns
- Implement vendor credit notes handling for purchase returns
- Add email sending endpoints for POs, invoices, and notifications
- Generate OpenAPI specification for client SDK generation
- Complete unit tests for 9 services (users, org, customers, vendors, warehouses, invoicing, purchases, goods receiving, stock management)
- Add E2E tests for auth, items, sales order, and PO workflows

### Web Frontend Completion
- Item management: variants UI, image upload, bulk import
- Customer management: details page with transactions, addresses, statement printing
- Vendor management: details page with transactions, vendor-item linking
- Warehouse management: bin locations UI, stock by bin view
- Sales orders: shipment creation modal, order PDF preview
- Invoicing: email sending, payments received list
- Sales returns: return creation from invoice, inspection workflow, credit note view
- Purchase orders: email sending
- Goods receiving: GRN creation form with quantity entry and bin assignment, print view
- Purchase bills: bill creation from GRN, payment recording modal, payments made list
- Stock management: adjustment approval, count creation wizard, count entry form, variance review
- Reports: PDF/Excel export for all reports
- Settings: logo upload UI

### Mobile Completion
- Push notifications setup
- Warehouse selection screen
- Item details and bin stock view screens
- Conflict detection and flagging for offline sync

### Deployment Infrastructure
- Production Dockerfile and environment configuration
- Database migration scripts for production
- Web deployment configuration (Vercel/static hosting)
- Mobile app build configurations
- Deployment documentation

## Capabilities

### New Capabilities
- `file-uploads`: File upload infrastructure supporting organization logos and item images with validation, storage, and retrieval
- `bulk-data-operations`: CSV import for items/customers/vendors and Excel export for reports with progress tracking and error reporting
- `email-notifications`: Email sending service for purchase orders, invoices, and system notifications with template support
- `api-documentation`: OpenAPI 3.0 specification generation with Swagger UI and client SDK generation support
- `deployment-infrastructure`: Production deployment configuration including Docker, environment management, and CI/CD setup

### Modified Capabilities
- `item-management`: Add item variants (size, color, style) with SKU generation and inventory tracking per variant
- `sales-orders`: Add shipment creation with carrier/tracking info and delivery order PDF generation
- `sales-returns`: Add credit note generation from approved returns and credit application to customer accounts
- `invoicing`: Add payment receipt PDF generation and invoice email sending
- `purchase-orders`: Add PO email sending to vendors
- `purchase-bills`: Add vendor credit notes handling for purchase returns
- `goods-receiving`: Add direct GRN creation (without PO) support
- `mobile-warehouse`: Add push notifications, warehouse selection, and offline conflict detection

## Impact

### Backend
- New modules: `uploads`, `bulk-operations`, `email`, `openapi`
- Modified services: items, sales, sales-returns, invoices, purchases, bills, goods-receiving
- New dependencies: multer (file uploads), xlsx (Excel), nodemailer (email), @nestjs/swagger enhancements
- Database: New tables for variants, file metadata; modified tables for credit notes

### Web Frontend
- New pages: ~15 new routes for forms, lists, and detail views
- New components: file upload, bulk import wizard, email compose modal, PDF viewer
- Modified pages: items, customers, vendors, warehouses, sales, purchases, inventory, reports

### Mobile
- New dependencies: firebase_messaging (push notifications)
- New screens: warehouse selection, item details, bin stock view
- Modified: offline sync to handle conflicts

### Infrastructure
- New files: Dockerfile, docker-compose.yml, .env.production, deployment scripts
- CI/CD pipeline configuration
- Production database migration strategy

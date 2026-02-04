## Why

Phase 2 of the IMS implementation is 46% complete (57/123 tasks). This iteration completes the remaining 42 high-priority tasks to bring Phase 2 to 80% completion, focusing on core business workflows that are partially implemented but lack critical features like form UIs, PDF generation, email sending, and comprehensive test coverage.

## What Changes

### Backend Features
- Direct GRN creation endpoint (not from PO)
- Shipment creation endpoint for sales orders
- Delivery order PDF generation
- Payment receipt PDF generation
- Credit note generation and application
- Vendor credit notes handling
- PO email sending endpoint
- Unit tests for goods receiving, user, and organization services
- E2E tests for auth, user, items, and sales order workflows

### Web Frontend
- Goods receiving: GRN creation form, quantity entry, bin assignment, print view
- Purchase bills: Bill creation from GRN, payment recording modal, payments made list
- Sales returns: Return creation from invoice, inspection workflow, credit note view/print
- Stock counts: Adjustment approval, count creation wizard, entry form, variance review
- Sales orders: Shipment creation modal, order PDF preview/print
- Invoicing: Invoice email sending, payments received list
- Vendors: Details page with transactions, vendor-item linking UI
- Customers: Details page with transactions, addresses management, statement view/print
- Warehouses: Bin locations management UI, stock by bin view
- Reports: PDF/Excel export buttons for all reports
- Purchase orders: PO email sending UI

## Capabilities

### New Capabilities
- `shipments`: Shipment creation, tracking, and delivery order PDF generation for sales orders
- `email-notifications`: Email sending infrastructure for POs and invoices
- `credit-notes`: Credit note generation, application, and printing for both sales and purchase returns

### Modified Capabilities
- `goods-receiving`: Add direct GRN creation (not from PO), bin assignment UI, print view
- `purchase-bills`: Add bill creation from GRN workflow, payment recording modal, payments list
- `sales-returns`: Add return creation from invoice, inspection workflow UI, credit note integration
- `stock-management`: Add stock count creation wizard, entry form, variance review, adjustment approval
- `sales-orders`: Add shipment creation modal, order PDF preview/print
- `invoicing`: Add email sending, payments received list page
- `vendor-management`: Add vendor details page with transactions, vendor-item linking UI
- `customer-management`: Add customer details page with transactions, addresses UI, statement view/print
- `warehouse-management`: Add bin locations management UI, stock by bin view
- `reporting`: Add PDF/Excel export buttons for all report pages
- `testing-infrastructure`: Add E2E tests for auth, user, items, sales order workflows; unit tests for goods receiving, user, organization services

## Impact

### Backend (NestJS)
- `src/modules/sales-orders/`: New shipment endpoints, delivery PDF
- `src/modules/invoices/`: Payment receipt PDF, email sending
- `src/modules/purchase-orders/`: Email sending endpoint
- `src/modules/goods-receiving/`: Direct GRN creation
- `src/modules/sales-returns/`: Credit note generation
- `src/modules/purchase-returns/`: Vendor credit notes
- `src/services/pdf.service.ts`: New PDF templates
- `src/services/email.service.ts`: New email templates
- `test/`: E2E test files for multiple modules

### Web Frontend (Next.js)
- `src/app/purchases/receiving/`: GRN creation forms
- `src/app/purchases/bills/`: Bill creation, payments
- `src/app/sales/returns/`: Return creation, inspection UI
- `src/app/inventory/counts/`: Count wizard, entry forms
- `src/app/sales/orders/`: Shipment modal, PDF preview
- `src/app/sales/invoices/`: Email sending, payments list
- `src/app/vendors/`: Details page, item linking
- `src/app/customers/`: Details page, addresses, statements
- `src/app/warehouses/`: Bin management, stock view
- `src/app/reports/`: Export buttons

### APIs
- New endpoints for shipments, credit notes, email sending
- Extended endpoints for GRN, payments, bin management

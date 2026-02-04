# IMS Phase 2 Backlog

Incomplete tasks carried over from the MVP implementation (inventory-management-system change).

---

## Backend: Unit & E2E Tests

- [x] 3.9 Write unit tests for auth service *(implemented)*
- [ ] 3.10 Write E2E tests for auth endpoints
- [ ] 4.7 Write unit tests for user service
- [ ] 4.8 Write E2E tests for user endpoints
- [ ] 5.7 Write unit tests for organization service
- [x] 6.10 Write unit tests for items service *(implemented)*
- [ ] 6.11 Write E2E tests for items endpoints
- [x] 7.10 Write unit tests for customers service *(19 tests in customers.service.spec.ts)*
- [x] 8.8 Write unit tests for vendors service *(27 tests in vendors.service.spec.ts)*
- [x] 9.8 Write unit tests for warehouses service *(32 tests in warehouses.service.spec.ts)*
- [x] 10.13 Write unit tests for sales orders service *(implemented)*
- [ ] 10.14 Write E2E tests for sales order workflow
- [x] 11.11 Write unit tests for invoicing service *(29 tests in invoices.service.spec.ts)*
- [x] 13.9 Write unit tests for purchase orders service *(implemented in purchases.service.spec.ts)*
- [ ] 13.10 Write E2E tests for PO workflow
- [ ] 14.9 Write unit tests for goods receiving service
- [x] 16.12 Write unit tests for stock management service *(32 tests in inventory.service.spec.ts)*

**Additional tests found (not in original backlog):**
- [x] Reports service unit tests *(implemented)*
- [x] Bills service unit tests *(implemented)*
- [x] Sales returns service unit tests *(implemented)*

**E2E Test Infrastructure:**
- [x] E2E test configuration with uuid ESM handling *(jest-e2e.json updated)*
- [x] Basic E2E tests for auth and protected routes *(8 tests in app.e2e-spec.ts)*

## Backend: File Uploads & Media

- [ ] 5.3 Implement logo upload with file validation
- [ ] 6.7 Implement item image upload endpoints

## Backend: Bulk Import/Export

- [ ] 6.9 Implement bulk item import from CSV
- [ ] 7.9 Implement bulk customer import from CSV
- [ ] 8.7 Implement bulk vendor import from CSV
- [x] 17.12 Implement Excel export for reports *(stock-valuation and sales-by-customer endpoints in reports.controller.ts)*

## Backend: Item Variants

- [ ] 6.4 Implement item variants management

## Backend: Sales & Invoicing

- [ ] 10.10 Implement shipment creation endpoint
- [ ] 10.11 Implement delivery order PDF generation
- [x] 10.12 Implement sales order PDF generation *(implemented in pdf.service.ts)*
- [ ] 11.8 Implement payment receipt PDF generation
- [x] 11.9 Implement invoice PDF generation *(implemented in pdf.service.ts)*
- [ ] 12.6 Implement credit note generation
- [ ] 12.7 Implement credit note application

## Backend: Purchasing

- [ ] 13.6 Implement PO email sending endpoint
- [x] 13.7 Implement PO PDF generation *(implemented in pdf.service.ts)*
- [ ] 14.3 Implement direct GRN creation
- [x] 14.8 Implement GRN printing endpoint *(implemented in pdf.service.ts)*
- [ ] 15.7 Implement vendor credit notes handling

## Backend: API Documentation

- [ ] 18.4 Generate OpenAPI spec file for client generation

---

## Web: Dashboard

- [x] 20.6 Implement recent activity feed *(implemented in dashboard page)*

## Web: Items Management

- [ ] 21.6 Implement item variants management UI
- [ ] 21.8 Implement item image upload UI
- [ ] 21.9 Implement bulk import UI with CSV upload

## Web: Customers Management

- [ ] 22.5 Implement customer details page with transactions
- [ ] 22.6 Implement customer addresses management UI
- [ ] 22.7 Implement customer statement view/print

## Web: Vendors Management

- [ ] 23.5 Implement vendor details page with transactions
- [ ] 23.6 Implement vendor-item linking UI

## Web: Warehouses Management

- [ ] 24.4 Implement bin locations management UI
- [ ] 24.5 Implement stock by bin view

## Web: Sales Orders

- [x] 25.9 Implement pick list generation and view *(embedded in sales order detail page)*
- [ ] 25.10 Implement shipment creation modal
- [ ] 25.11 Implement order PDF preview and print

## Web: Invoicing

- [x] 26.3 Implement direct invoice creation form *(implemented in /sales/invoices/new)*
- [x] 26.6 Implement invoice PDF preview and print *(implemented in invoice detail page)*
- [ ] 26.7 Implement invoice email sending
- [ ] 26.8 Implement payments received list page

## Web: Sales Returns

- [x] 27.1 Create sales returns list page *(implemented in /sales/returns)*
- [ ] 27.2 Implement return creation from invoice
- [x] 27.3 Implement return details page *(implemented in /sales/returns/[id])*
- [ ] 27.4 Implement return inspection workflow UI
- [ ] 27.5 Implement credit note view and print

## Web: Purchase Orders

- [x] 28.7 Implement PO PDF preview and print *(endpoint exists, UI can trigger download)*
- [ ] 28.8 Implement PO email sending

## Web: Goods Receiving

- [x] 29.1 Create goods received list page *(implemented in /purchases/receiving)*
- [ ] 29.2 Implement GRN creation from PO
- [ ] 29.3 Implement receiving form with quantity entry
- [ ] 29.4 Implement bin assignment in receiving form
- [x] 29.5 Implement GRN details page *(implemented in /purchases/receiving/[id])*
- [ ] 29.6 Implement GRN print view

## Web: Purchase Bills

- [x] 30.1 Create bills list page *(implemented in /purchases/bills)*
- [ ] 30.2 Implement bill creation from GRN
- [x] 30.3 Implement bill details page *(implemented in /purchases/bills/[id])*
- [ ] 30.4 Implement payment recording modal
- [ ] 30.5 Implement payments made list page

## Web: Stock Management

- [ ] 31.3 Implement adjustment details and approval
- [x] 31.4 Create stock counts list page *(implemented in /inventory/counts)*
- [ ] 31.5 Implement count creation wizard
- [ ] 31.6 Implement count entry form
- [ ] 31.7 Implement variance review page

## Web: Reports

- [x] 32.3 Implement stock valuation report page *(implemented in /reports/stock-valuation)*
- [x] 32.6 Implement sales by customer report page *(implemented in /reports/sales-by-customer)*
- [ ] 32.10 Implement PDF/Excel export buttons for all reports

## Web: Settings

- [ ] 33.3 Implement logo upload UI

---

## Mobile: Core Setup

- [x] 34.4 Setup offline storage *(implemented using SharedPreferences in offline_storage.dart)*
- [ ] 34.7 Setup push notifications

## Mobile: Authentication

- [ ] 35.5 Implement warehouse selection screen

## Mobile: Stock Lookup

- [ ] 36.4 Implement item details screen with stock
- [ ] 36.5 Implement bin stock view screen

## Mobile: Pick List Processing

- [x] 37.1 Implement pick lists list screen *(implemented in pick_list_screen.dart)*
- [x] 37.2 Implement pick list details screen *(implemented in PickListProcessScreen)*
- [x] 37.3 Implement picking workflow with scanner *(implemented with barcode scanning)*
- [x] 37.4 Implement pick quantity confirmation *(implemented)*
- [x] 37.5 Implement short pick handling *(implemented)*
- [x] 37.6 Implement pick list completion *(implemented)*

## Mobile: Goods Receiving

- [x] 38.1 Implement open POs list screen *(implemented in goods_receiving_screen.dart)*
- [x] 38.2 Implement receiving screen with items *(implemented in GoodsReceivingProcessScreen)*
- [x] 38.3 Implement scan-to-receive workflow *(implemented with barcode scanning)*
- [x] 38.4 Implement quantity entry and bin assignment *(implemented)*
- [x] 38.5 Implement GRN completion *(implemented)*

## Mobile: Stock Count

- [x] 39.1 Implement stock counts list screen *(implemented in stock_count_screen.dart)*
- [x] 39.2 Implement count session screen *(implemented in StockCountProcessScreen)*
- [x] 39.3 Implement scan-and-count workflow *(implemented with barcode scanning)*
- [x] 39.4 Implement count entry with variance display *(implemented)*
- [x] 39.5 Implement count submission *(implemented)*

## Mobile: Offline Support

- [x] 40.1 Implement item data caching *(implemented in offline_storage.dart)*
- [x] 40.2 Implement stock levels caching *(implemented in offline_storage.dart)*
- [x] 40.3 Implement offline operation queue *(implemented in sync_queue.dart)*
- [x] 40.4 Implement automatic sync on reconnect *(implemented in sync_manager.dart)*
- [x] 40.5 Implement sync status indicators *(implemented in sync_status_widget.dart)*
- [ ] 40.6 Implement conflict detection and flagging

---

## Integration & Testing

- [x] 41.1 Setup E2E testing environment *(jest-e2e.json configured, basic tests passing)*
- [ ] 41.2 Write E2E tests for complete sales workflow
- [ ] 41.3 Write E2E tests for complete purchase workflow
- [ ] 41.4 Write E2E tests for stock management workflow
- [ ] 41.5 Performance testing for report generation
- [ ] 41.6 Load testing for concurrent users

## Deployment Preparation

- [ ] 42.1 Create production Dockerfile for backend
- [ ] 42.2 Configure production environment variables
- [ ] 42.3 Setup database migration scripts for production
- [ ] 42.4 Configure web deployment (Vercel or static hosting)
- [ ] 42.5 Prepare mobile app build configurations
- [ ] 42.6 Create deployment documentation

---

## Summary

| Category | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| Backend Tests | 22 | 15 | 7 |
| Backend Features | 18 | 5 | 13 |
| Web Frontend | 44 | 14 | 30 |
| Mobile | 27 | 22 | 5 |
| Integration & Deployment | 12 | 1 | 11 |
| **Total** | **123** | **57** | **66** |

### Progress: 46% Complete (57/123 tasks)

### Suggested Phase 3 Priorities

1. **High Priority - Complete Core Web Workflows**
   - GRN creation form with quantity entry (29.2-29.4)
   - Bill creation from GRN (30.2)
   - Return creation from invoice (27.2)
   - Stock count entry form (31.5-31.7)
   - PDF/Excel export buttons in report UI (32.10)

2. **Medium Priority - Backend Features**
   - Shipment creation endpoint (10.10)
   - Credit note generation (12.6, 12.7)
   - Vendor credit notes (15.7)
   - Email sending endpoints (13.6, 26.7)
   - Goods receiving service unit tests (14.9)

3. **Medium Priority - E2E Tests**
   - E2E tests for complete sales workflow (41.2)
   - E2E tests for complete purchase workflow (41.3)
   - E2E tests for stock management workflow (41.4)

4. **Lower Priority - Nice to Have**
   - Bulk import/export (CSV)
   - Item variants management
   - File uploads (logos, images)
   - Mobile push notifications
   - Mobile conflict detection

---

*Updated: 2026-02-04*
*Validated against codebase implementation*
*Source: ims-phase-2-completion and ims-phase-2-tests-and-gaps changes (archived)*

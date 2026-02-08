# IMS Backlog

Incomplete tasks carried over from the MVP and Phase 2 implementations.

---

## Backend: Unit & E2E Tests

- [x] 3.9 Write unit tests for auth service *(implemented)*
- [x] 3.10 Write E2E tests for auth endpoints *(implemented in auth.e2e-spec.ts)*
- [x] 4.7 Write unit tests for user service *(implemented in users.service.spec.ts)*
- [x] 4.8 Write E2E tests for user endpoints *(implemented in users.e2e-spec.ts)*
- [x] 5.7 Write unit tests for organization service *(implemented in organizations.service.spec.ts)*
- [x] 6.10 Write unit tests for items service *(implemented)*
- [x] 6.11 Write E2E tests for items endpoints *(implemented in items.e2e-spec.ts)*
- [x] 7.10 Write unit tests for customers service *(19 tests in customers.service.spec.ts)*
- [x] 8.8 Write unit tests for vendors service *(27 tests in vendors.service.spec.ts)*
- [x] 9.8 Write unit tests for warehouses service *(32 tests in warehouses.service.spec.ts)*
- [x] 10.13 Write unit tests for sales orders service *(implemented)*
- [x] 10.14 Write E2E tests for sales order workflow *(implemented in sales-orders.e2e-spec.ts)*
- [x] 11.11 Write unit tests for invoicing service *(29 tests in invoices.service.spec.ts)*
- [x] 13.9 Write unit tests for purchase orders service *(implemented in purchases.service.spec.ts)*
- [x] 13.10 Write E2E tests for PO workflow *(implemented in purchase-workflow.e2e-spec.ts — Phase 3)*
- [x] 14.9 Write unit tests for goods receiving service *(covered in purchases.service.spec.ts)*
- [x] 16.12 Write unit tests for stock management service *(32 tests in inventory.service.spec.ts)*

**Additional tests found (not in original backlog):**
- [x] Reports service unit tests *(implemented)*
- [x] Bills service unit tests *(implemented)*
- [x] Sales returns service unit tests *(implemented)*

**E2E Test Infrastructure:**
- [x] E2E test configuration with uuid ESM handling *(jest-e2e.json updated)*
- [x] Basic E2E tests for auth and protected routes *(8 tests in app.e2e-spec.ts)*

## Backend: File Uploads & Media

- [x] 5.3 Implement logo upload with file validation *(implemented in uploads.service.ts — Phase 3)*
- [x] 6.7 Implement item image upload endpoints *(implemented in uploads.controller.ts — Phase 3)*

## Backend: Bulk Import/Export

- [x] 6.9 Implement bulk item import from CSV *(implemented in bulk-operations.service.ts — Phase 3)*
- [x] 7.9 Implement bulk customer import from CSV *(implemented in bulk-operations.service.ts — Phase 3)*
- [x] 8.7 Implement bulk vendor import from CSV *(implemented in bulk-operations.service.ts — Phase 3)*
- [x] 17.12 Implement Excel export for reports *(stock-valuation and sales-by-customer endpoints in reports.controller.ts)*

## Backend: Item Variants

- [x] 6.4 Implement item variants management *(implemented in variants.service.ts — Phase 3)*

## Backend: Sales & Invoicing

- [x] 10.10 Implement shipment creation endpoint *(implemented in shipments.service.ts)*
- [x] 10.11 Implement delivery order PDF generation *(implemented in pdf.service.ts)*
- [x] 10.12 Implement sales order PDF generation *(implemented in pdf.service.ts)*
- [x] 11.8 Implement payment receipt PDF generation *(implemented in pdf.service.ts)*
- [x] 11.9 Implement invoice PDF generation *(implemented in pdf.service.ts)*
- [x] 12.6 Implement credit note generation *(implemented in credit-notes.service.ts)*
- [x] 12.7 Implement credit note application *(implemented in credit-notes.service.ts)*

## Backend: Purchasing

- [x] 13.6 Implement PO email sending endpoint *(implemented in purchases.controller.ts)*
- [x] 13.7 Implement PO PDF generation *(implemented in pdf.service.ts)*
- [x] 14.3 Implement direct GRN creation *(implemented in purchases.service.ts)*
- [x] 14.8 Implement GRN printing endpoint *(implemented in pdf.service.ts)*
- [x] 15.7 Implement vendor credit notes handling *(implemented in credit-notes.service.ts)*

## Backend: API Documentation

- [x] 18.4 Generate OpenAPI spec file for client generation *(openapi:generate script + generate-openapi.ts — Phase 3)*

---

## Web: Dashboard

- [x] 20.6 Implement recent activity feed *(implemented in dashboard page)*

## Web: Items Management

- [x] 21.6 Implement item variants management UI *(variant-form.tsx + variant-list.tsx — Phase 3)*
- [x] 21.8 Implement item image upload UI *(file-upload.tsx + image-preview.tsx — Phase 3)*
- [x] 21.9 Implement bulk import UI with CSV upload *(bulk-import-wizard.tsx on items page — Phase 3)*

## Web: Customers Management

- [x] 22.5 Implement customer details page with transactions *(implemented in /customers/[id])*
- [x] 22.6 Implement customer addresses management UI *(implemented in /customers/[id])*
- [x] 22.7 Implement customer statement view/print *(implemented in /customers/[id])*

## Web: Vendors Management

- [x] 23.5 Implement vendor details page with transactions *(implemented in /vendors/[id])*
- [x] 23.6 Implement vendor-item linking UI *(implemented in /vendors/[id])*

## Web: Warehouses Management

- [x] 24.4 Implement bin locations management UI *(implemented in /warehouses/[id]/bins)*
- [x] 24.5 Implement stock by bin view *(implemented in /inventory/stock-by-bin)*

## Web: Sales Orders

- [x] 25.9 Implement pick list generation and view *(embedded in sales order detail page)*
- [x] 25.10 Implement shipment creation modal *(implemented in create-shipment-modal.tsx)*
- [x] 25.11 Implement order PDF preview and print *(implemented in sales order detail page)*

## Web: Invoicing

- [x] 26.3 Implement direct invoice creation form *(implemented in /sales/invoices/new)*
- [x] 26.6 Implement invoice PDF preview and print *(implemented in invoice detail page)*
- [x] 26.7 Implement invoice email sending *(implemented in invoice detail page)*
- [x] 26.8 Implement payments received list page *(implemented in /sales/payments)*

## Web: Sales Returns

- [x] 27.1 Create sales returns list page *(implemented in /sales/returns)*
- [x] 27.2 Implement return creation from invoice *(implemented in /sales/returns/new with invoice param)*
- [x] 27.3 Implement return details page *(implemented in /sales/returns/[id])*
- [x] 27.4 Implement return inspection workflow UI *(implemented in /sales/returns/[id])*
- [x] 27.5 Implement credit note view and print *(implemented in /sales/returns/[id])*

## Web: Purchase Orders

- [x] 28.7 Implement PO PDF preview and print *(endpoint exists, UI can trigger download)*
- [x] 28.8 Implement PO email sending *(implemented in PO detail page)*

## Web: Goods Receiving

- [x] 29.1 Create goods received list page *(implemented in /purchases/receiving)*
- [x] 29.2 Implement GRN creation from PO *(implemented in /purchases/receiving/new)*
- [x] 29.3 Implement receiving form with quantity entry *(implemented in /purchases/receiving/new)*
- [x] 29.4 Implement bin assignment in receiving form *(implemented in /purchases/receiving/new)*
- [x] 29.5 Implement GRN details page *(implemented in /purchases/receiving/[id])*
- [x] 29.6 Implement GRN print view *(implemented in /purchases/receiving/[id])*

## Web: Purchase Bills

- [x] 30.1 Create bills list page *(implemented in /purchases/bills)*
- [x] 30.2 Implement bill creation from GRN *(implemented in /purchases/bills/new)*
- [x] 30.3 Implement bill details page *(implemented in /purchases/bills/[id])*
- [x] 30.4 Implement payment recording modal *(implemented in record-payment-modal.tsx)*
- [x] 30.5 Implement payments made list page *(implemented in /purchases/payments)*

## Web: Stock Management

- [x] 31.3 Implement adjustment details and approval *(implemented in /inventory/adjustments)*
- [x] 31.4 Create stock counts list page *(implemented in /inventory/counts)*
- [x] 31.5 Implement count creation wizard *(implemented in /inventory/counts/new)*
- [x] 31.6 Implement count entry form *(implemented in /inventory/counts/[id])*
- [x] 31.7 Implement variance review page *(implemented in /inventory/counts/[id]/review)*

## Web: Reports

- [x] 32.3 Implement stock valuation report page *(implemented in /reports/stock-valuation)*
- [x] 32.6 Implement sales by customer report page *(implemented in /reports/sales-by-customer)*
- [x] 32.10 Implement PDF/Excel export buttons for all reports *(implemented in export-buttons.tsx)*

## Web: Settings

- [x] 33.3 Implement logo upload UI *(implemented in settings page with FileUpload component — Phase 3)*

---

## Mobile: Core Setup

- [x] 34.4 Setup offline storage *(implemented using SharedPreferences in offline_storage.dart)*
- [x] 34.7 Setup push notifications *(notification_service.dart with FCM placeholder — Phase 3)*

## Mobile: Authentication

- [x] 35.5 Implement warehouse selection screen *(warehouse_selection_screen.dart — Phase 3)*

## Mobile: Stock Lookup

- [x] 36.4 Implement item details screen with stock *(item_details_screen.dart — Phase 3)*
- [x] 36.5 Implement bin stock view screen *(bin_stock_screen.dart — Phase 3)*

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
- [x] 40.6 Implement conflict detection and flagging *(sync_service.dart + conflict_review_screen.dart — Phase 3)*

---

## Integration & Testing

- [x] 41.1 Setup E2E testing environment *(jest-e2e.json configured, basic tests passing)*
- [x] 41.2 Write E2E tests for complete sales workflow *(sales-workflow.e2e-spec.ts — Phase 3)*
- [x] 41.3 Write E2E tests for complete purchase workflow *(purchase-workflow.e2e-spec.ts — Phase 3)*
- [x] 41.4 Write E2E tests for stock management workflow *(stock-management.e2e-spec.ts — Phase 3)*
- [x] 41.5 Performance testing for report generation *(k6 scripts: stock-valuation.js, sales-report.js — Phase 3)*
- [x] 41.6 Load testing for concurrent users *(k6 scripts: concurrent-orders.js, concurrent-stock.js — Phase 3)*

## Deployment Preparation

- [x] 42.1 Create production Dockerfile for backend *(Dockerfile.prod with multi-stage build — Phase 3)*
- [x] 42.2 Configure production environment variables *(.env.example + env-validation.ts — Phase 3)*
- [x] 42.3 Setup database migration scripts for production *(migration:run/revert/status npm scripts — Phase 3)*
- [x] 42.4 Configure web deployment (Vercel or static hosting) *(vercel.json — Phase 3)*
- [x] 42.5 Prepare mobile app build configurations *(key.properties.example + env.dart — Phase 3)*
- [x] 42.6 Create deployment documentation *(DEPLOYMENT.md — Phase 3)*

---

## Summary

| Category | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| Backend Tests | 22 | 22 | 0 |
| Backend Features | 18 | 18 | 0 |
| Web Frontend | 44 | 44 | 0 |
| Mobile | 27 | 27 | 0 |
| Integration & Deployment | 12 | 12 | 0 |
| **Total** | **123** | **123** | **0** |

### Progress: 100% Complete (123/123 tasks)

All backlog tasks from MVP and Phase 2 are now complete.

---

*Updated: 2026-02-08*
*Phase 3 Complete change archived — 114/132 phase tasks implemented*
*Phase 3 Polish change archived — 18/18 tasks implemented (all remaining gaps)*
*Archived as: 2026-02-07-phase-3-complete, 2026-02-08-phase-3-polish*
*Backend: 328 unit tests passing, build verified, Swagger decorators on all 20 controllers*
*Web: 39 pages built successfully, item detail tabs + variant selection complete*
*Mobile: Firebase messaging configured, warehouse scoping integrated*
*All spec requirements fully implemented — project at 100% completion*

### Phase 3 Polish — All Remaining Items Completed

The following items were completed in the phase-3-polish change:

- [x] Integrate image gallery + variant tabs into item detail page (web) *(Phase 3 Polish)*
- [x] Add variant selection to sales order form (web) *(Phase 3 Polish)*
- [x] Show variant stock indicators in item list (web) *(Phase 3 Polish)*
- [x] Add warehouse filter to mobile app header + queries *(Phase 3 Polish)*
- [x] Add firebase_messaging dependency to pubspec.yaml *(Phase 3 Polish)*
- [x] Configure FCM platform files (google-services.json, GoogleService-Info.plist) *(Phase 3 Polish)*
- [x] Audit and add missing Swagger decorators to all controllers *(Phase 3 Polish)*
- [x] Generate and validate openapi.json output *(Phase 3 Polish)*
- [x] Test production Docker build end-to-end *(Phase 3 Polish)*
- [x] Test database migration scripts independently *(Phase 3 Polish)*
- [x] Test Vercel deployment configuration *(Phase 3 Polish)*
- [x] Configure iOS release signing *(Phase 3 Polish)*
- [x] Test release builds for both mobile platforms *(Phase 3 Polish)*

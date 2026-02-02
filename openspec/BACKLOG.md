# IMS Phase 2 Backlog

Incomplete tasks carried over from the MVP implementation (inventory-management-system change).

---

## Backend: Unit & E2E Tests

- [ ] 3.9 Write unit tests for auth service
- [ ] 3.10 Write E2E tests for auth endpoints
- [ ] 4.7 Write unit tests for user service
- [ ] 4.8 Write E2E tests for user endpoints
- [ ] 5.7 Write unit tests for organization service
- [ ] 6.10 Write unit tests for items service
- [ ] 6.11 Write E2E tests for items endpoints
- [ ] 7.10 Write unit tests for customers service
- [ ] 8.8 Write unit tests for vendors service
- [ ] 9.8 Write unit tests for warehouses service
- [ ] 10.13 Write unit tests for sales orders service
- [ ] 10.14 Write E2E tests for sales order workflow
- [ ] 11.11 Write unit tests for invoicing service
- [ ] 13.9 Write unit tests for purchase orders service
- [ ] 13.10 Write E2E tests for PO workflow
- [ ] 14.9 Write unit tests for goods receiving service
- [ ] 16.12 Write unit tests for stock management service

## Backend: File Uploads & Media

- [ ] 5.3 Implement logo upload with file validation
- [ ] 6.7 Implement item image upload endpoints

## Backend: Bulk Import/Export

- [ ] 6.9 Implement bulk item import from CSV
- [ ] 7.9 Implement bulk customer import from CSV
- [ ] 8.7 Implement bulk vendor import from CSV
- [ ] 17.12 Implement Excel export for reports

## Backend: Item Variants

- [ ] 6.4 Implement item variants management

## Backend: Sales & Invoicing

- [ ] 10.10 Implement shipment creation endpoint
- [ ] 10.11 Implement delivery order PDF generation
- [ ] 10.12 Implement sales order PDF generation
- [ ] 11.8 Implement payment receipt PDF generation
- [ ] 11.9 Implement invoice PDF generation
- [ ] 12.6 Implement credit note generation
- [ ] 12.7 Implement credit note application

## Backend: Purchasing

- [ ] 13.6 Implement PO email sending endpoint
- [ ] 13.7 Implement PO PDF generation
- [ ] 14.3 Implement direct GRN creation
- [ ] 14.8 Implement GRN printing endpoint
- [ ] 15.7 Implement vendor credit notes handling

## Backend: API Documentation

- [ ] 18.4 Generate OpenAPI spec file for client generation

---

## Web: Dashboard

- [ ] 20.6 Implement recent activity feed

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

- [ ] 25.9 Implement pick list generation and view
- [ ] 25.10 Implement shipment creation modal
- [ ] 25.11 Implement order PDF preview and print

## Web: Invoicing

- [ ] 26.3 Implement direct invoice creation form
- [ ] 26.6 Implement invoice PDF preview and print
- [ ] 26.7 Implement invoice email sending
- [ ] 26.8 Implement payments received list page

## Web: Sales Returns (Full Module)

- [ ] 27.1 Create sales returns list page
- [ ] 27.2 Implement return creation from invoice
- [ ] 27.3 Implement return details page
- [ ] 27.4 Implement return inspection workflow UI
- [ ] 27.5 Implement credit note view and print

## Web: Purchase Orders

- [ ] 28.7 Implement PO PDF preview and print
- [ ] 28.8 Implement PO email sending

## Web: Goods Receiving (Full Module)

- [ ] 29.1 Create goods received list page
- [ ] 29.2 Implement GRN creation from PO
- [ ] 29.3 Implement receiving form with quantity entry
- [ ] 29.4 Implement bin assignment in receiving form
- [ ] 29.5 Implement GRN details page
- [ ] 29.6 Implement GRN print view

## Web: Purchase Bills (Full Module)

- [ ] 30.1 Create bills list page
- [ ] 30.2 Implement bill creation from GRN
- [ ] 30.3 Implement bill details page
- [ ] 30.4 Implement payment recording modal
- [ ] 30.5 Implement payments made list page

## Web: Stock Management

- [ ] 31.3 Implement adjustment details and approval
- [ ] 31.4 Create stock counts list page
- [ ] 31.5 Implement count creation wizard
- [ ] 31.6 Implement count entry form
- [ ] 31.7 Implement variance review page

## Web: Reports

- [ ] 32.3 Implement stock valuation report page
- [ ] 32.6 Implement sales by customer report page
- [ ] 32.10 Implement PDF/Excel export buttons for all reports

## Web: Settings

- [ ] 33.3 Implement logo upload UI

---

## Mobile: Core Setup

- [ ] 34.4 Setup SQLite/Isar for offline storage
- [ ] 34.7 Setup push notifications

## Mobile: Authentication

- [ ] 35.5 Implement warehouse selection screen

## Mobile: Stock Lookup

- [ ] 36.4 Implement item details screen with stock
- [ ] 36.5 Implement bin stock view screen

## Mobile: Pick List Processing (Full Module)

- [ ] 37.1 Implement pick lists list screen
- [ ] 37.2 Implement pick list details screen
- [ ] 37.3 Implement picking workflow with scanner
- [ ] 37.4 Implement pick quantity confirmation
- [ ] 37.5 Implement short pick handling
- [ ] 37.6 Implement pick list completion

## Mobile: Goods Receiving (Full Module)

- [ ] 38.1 Implement open POs list screen
- [ ] 38.2 Implement receiving screen with items
- [ ] 38.3 Implement scan-to-receive workflow
- [ ] 38.4 Implement quantity entry and bin assignment
- [ ] 38.5 Implement GRN completion

## Mobile: Stock Count (Full Module)

- [ ] 39.1 Implement stock counts list screen
- [ ] 39.2 Implement count session screen
- [ ] 39.3 Implement scan-and-count workflow
- [ ] 39.4 Implement count entry with variance display
- [ ] 39.5 Implement count submission

## Mobile: Offline Support (Full Module)

- [ ] 40.1 Implement item data caching
- [ ] 40.2 Implement stock levels caching
- [ ] 40.3 Implement offline operation queue
- [ ] 40.4 Implement automatic sync on reconnect
- [ ] 40.5 Implement sync status indicators
- [ ] 40.6 Implement conflict detection and flagging

---

## Integration & Testing

- [ ] 41.1 Setup E2E testing environment
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

| Category | Incomplete Tasks |
|----------|------------------|
| Backend Tests | 17 |
| Backend Features | 18 |
| Web Frontend | 44 |
| Mobile | 27 |
| Integration & Deployment | 12 |
| **Total** | **122** |

### Suggested Phase 2 Priorities

1. **High Priority - Complete Core Web Modules**
   - Goods Receiving UI (29.x)
   - Purchase Bills UI (30.x)
   - Sales Returns UI (27.x)
   - Stock Counts UI (31.4-31.7)

2. **Medium Priority - PDF Generation & Printing**
   - Invoice/SO/PO PDF generation
   - Print views for all documents

3. **Medium Priority - Mobile Warehouse Operations**
   - Pick list processing (37.x)
   - Mobile goods receiving (38.x)
   - Mobile stock count (39.x)

4. **Lower Priority - Nice to Have**
   - Bulk import/export
   - Item variants
   - Offline mobile support
   - Full test coverage

---

*Generated: 2026-02-02*
*Source: inventory-management-system change (archived)*

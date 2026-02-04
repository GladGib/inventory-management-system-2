# IMS Phase 2 Implementation Tasks

## 1. Backend: File Upload Infrastructure

- [x] 1.1 Install multer dependency and configure file upload middleware
- [x] 1.2 Create uploads module with file storage service
- [x] 1.3 Implement organization logo upload endpoint (POST /organizations/:id/logo)
- [x] 1.4 Implement logo retrieval endpoint (GET /organizations/:id/logo)
- [x] 1.5 Implement item image upload endpoint (POST /items/:id/images)
- [x] 1.6 Implement item image deletion endpoint (DELETE /items/:id/images/:imageId)
- [x] 1.7 Implement image reordering endpoint (PATCH /items/:id/images/reorder)
- [x] 1.8 Add file validation (type, size limits)
- [ ] 1.9 Write unit tests for upload service

## 2. Backend: Bulk Import/Export Operations

- [x] 2.1 Install csv-parse and xlsx dependencies
- [x] 2.2 Create bulk-operations module with import/export services
- [x] 2.3 Implement item CSV import endpoint with validation
- [x] 2.4 Implement item CSV template download endpoint
- [x] 2.5 Implement customer CSV import endpoint
- [x] 2.6 Implement customer CSV template download endpoint
- [x] 2.7 Implement vendor CSV import endpoint
- [x] 2.8 Implement vendor CSV template download endpoint
- [x] 2.9 Implement stock valuation Excel export endpoint
- [x] 2.10 Implement sales by customer Excel export endpoint
- [x] 2.11 Add dry-run validation mode for imports
- [ ] 2.12 Write unit tests for import/export services

## 3. Backend: Email Notifications

- [x] 3.1 Install nodemailer and handlebars dependencies
- [x] 3.2 Create email module with SMTP configuration
- [x] 3.3 Create email templates (PO, invoice, notification)
- [x] 3.4 Implement PO email sending endpoint (POST /purchase-orders/:id/send-email)
- [x] 3.5 Implement invoice email sending endpoint (POST /invoices/:id/send-email)
- [ ] 3.6 Add email delivery logging and tracking
- [ ] 3.7 Implement email configuration endpoint for admin
- [ ] 3.8 Write unit tests for email service

## 4. Backend: Item Variants

- [x] 4.1 Create item_variants database migration
- [x] 4.2 Create ItemVariant entity and DTOs
- [x] 4.3 Implement variant creation when item has attributes
- [x] 4.4 Implement variant SKU generation logic
- [x] 4.5 Update inventory tracking to work with variants
- [x] 4.6 Implement variant CRUD endpoints
- [x] 4.7 Update item endpoints to include variant data
- [ ] 4.8 Write unit tests for variant management

## 5. Backend: Sales Order Enhancements

- [x] 5.1 Create shipments database migration
- [x] 5.2 Create Shipment entity and DTOs
- [x] 5.3 Implement shipment creation endpoint (POST /sales-orders/:id/shipments)
- [x] 5.4 Implement partial shipment support
- [x] 5.5 Add delivery order PDF generation to pdf.service.ts
- [x] 5.6 Implement delivery order PDF endpoint (GET /shipments/:id/delivery-order)
- [ ] 5.7 Write unit tests for shipment service

## 6. Backend: Credit Notes & Sales Returns

- [x] 6.1 Create credit_notes database migration
- [x] 6.2 Create CreditNote entity and DTOs
- [x] 6.3 Implement credit note generation from approved return
- [x] 6.4 Add credit note PDF generation to pdf.service.ts
- [x] 6.5 Implement credit note application to invoices
- [x] 6.6 Implement credit note refund recording
- [x] 6.7 Add return inspection workflow endpoints (approve/reject)
- [ ] 6.8 Write unit tests for credit note service

## 7. Backend: Purchase Bills Enhancements

- [x] 7.1 Implement bill creation from GRN endpoint
- [x] 7.2 Implement payment recording endpoint (POST /bills/:id/payments)
- [x] 7.3 Create vendor_credit_notes database migration
- [x] 7.4 Implement vendor credit note recording
- [x] 7.5 Implement vendor credit application to bills
- [x] 7.6 Create payments made list endpoint
- [ ] 7.7 Write unit tests for bill payment service

## 8. Backend: Goods Receiving Enhancements

- [x] 8.1 Implement direct GRN creation (without PO) endpoint
- [x] 8.2 Add bin assignment support in GRN creation
- [x] 8.3 Validate bin codes against warehouse bins
- [ ] 8.4 Write unit tests for enhanced GRN service

## 9. Backend: API Documentation

- [ ] 9.1 Configure @nestjs/swagger with OpenAPI 3.0
- [ ] 9.2 Add API decorators to all DTOs
- [ ] 9.3 Add API decorators to all controllers
- [ ] 9.4 Generate openapi.json file on build
- [ ] 9.5 Configure Swagger UI at /api/docs

## 10. Backend: Unit Tests

- [ ] 10.1 Write unit tests for user service
- [ ] 10.2 Write unit tests for organization service
- [ ] 10.3 Write unit tests for customers service
- [ ] 10.4 Write unit tests for vendors service
- [ ] 10.5 Write unit tests for warehouses service
- [ ] 10.6 Write unit tests for invoicing service
- [x] 10.7 Write unit tests for purchase orders service
- [ ] 10.8 Write unit tests for goods receiving service
- [ ] 10.9 Write unit tests for stock management service

## 11. Backend: E2E Tests

- [ ] 11.1 Setup E2E testing environment with test database
- [ ] 11.2 Write E2E tests for auth endpoints
- [ ] 11.3 Write E2E tests for user endpoints
- [ ] 11.4 Write E2E tests for items endpoints
- [ ] 11.5 Write E2E tests for sales order workflow
- [ ] 11.6 Write E2E tests for PO workflow
- [ ] 11.7 Write E2E tests for stock management workflow

## 12. Web: Items Management

- [ ] 12.1 Create item variants configuration UI component
- [ ] 12.2 Implement variant list table in item detail
- [ ] 12.3 Add bulk variant operations (price update)
- [ ] 12.4 Create item image upload component with drag-drop
- [ ] 12.5 Implement image gallery in item form
- [ ] 12.6 Create bulk import wizard component
- [ ] 12.7 Implement CSV column mapping step
- [ ] 12.8 Implement import preview and validation step
- [ ] 12.9 Implement import progress and results step

## 13. Web: Customer Management

- [ ] 13.1 Create customer details page with tabs
- [ ] 13.2 Implement transactions tab showing orders/invoices
- [ ] 13.3 Create customer addresses management UI
- [ ] 13.4 Implement customer statement generation
- [ ] 13.5 Add statement print/PDF export

## 14. Web: Vendor Management

- [ ] 14.1 Create vendor details page with tabs
- [ ] 14.2 Implement transactions tab showing POs/bills
- [ ] 14.3 Create vendor-item linking UI
- [ ] 14.4 Show vendor items on vendor detail page

## 15. Web: Warehouse Management

- [ ] 15.1 Create bin locations management page
- [ ] 15.2 Implement bin CRUD operations
- [ ] 15.3 Create stock by bin view page
- [ ] 15.4 Add bin filtering and search

## 16. Web: Sales Orders

- [ ] 16.1 Create shipment creation modal component
- [ ] 16.2 Implement partial shipment quantity entry
- [ ] 16.3 Add carrier and tracking number fields
- [ ] 16.4 Implement shipment history display on order
- [ ] 16.5 Create order PDF preview modal
- [ ] 16.6 Add print button with browser print dialog

## 17. Web: Invoicing

- [ ] 17.1 Create invoice email compose modal
- [ ] 17.2 Implement email preview before sending
- [ ] 17.3 Add email history to invoice detail
- [x] 17.4 Create payments received list page
- [x] 17.5 Implement payment filters (date, customer, method)
- [ ] 17.6 Add payment search functionality

## 18. Web: Sales Returns

- [x] 18.1 Add "Create Return" button on invoice detail
- [x] 18.2 Implement return creation form from invoice
- [x] 18.3 Create return inspection workflow screen
- [x] 18.4 Implement item-by-item approval/rejection
- [x] 18.5 Add disposition selection (restock, write-off)
- [ ] 18.6 Create credit note detail page
- [ ] 18.7 Implement credit note print view
- [ ] 18.8 Add credit application modal

## 19. Web: Purchase Orders

- [ ] 19.1 Create PO email compose modal
- [ ] 19.2 Implement email preview with vendor details
- [ ] 19.3 Add email sent indicator on PO detail

## 20. Web: Goods Receiving

- [x] 20.1 Create GRN creation form from PO
- [x] 20.2 Implement quantity entry per item
- [ ] 20.3 Add bin location selector per item
- [ ] 20.4 Implement multi-bin split for large quantities
- [ ] 20.5 Add batch/lot entry for tracked items
- [ ] 20.6 Create GRN print view component

## 21. Web: Purchase Bills

- [x] 21.1 Create bill creation form from GRN
- [x] 21.2 Implement vendor invoice number entry
- [x] 21.3 Add price adjustment capability
- [x] 21.4 Create payment recording modal
- [x] 21.5 Implement payment method dropdown
- [x] 21.6 Create payments made list page
- [ ] 21.7 Add vendor credit note recording UI
- [ ] 21.8 Implement credit application in payment modal

## 22. Web: Stock Management

- [ ] 22.1 Create stock adjustment approval page
- [ ] 22.2 Implement approval/rejection workflow
- [x] 22.3 Create stock count creation wizard
- [x] 22.4 Implement count item selection step
- [x] 22.5 Create stock count entry form
- [ ] 22.6 Implement barcode scanning for count entry
- [x] 22.7 Create variance review page
- [x] 22.8 Add variance approval/adjustment actions

## 23. Web: Reports

- [ ] 23.1 Add PDF export button to all reports
- [ ] 23.2 Add Excel export button to all reports
- [ ] 23.3 Implement export progress indicator

## 24. Web: Settings

- [ ] 24.1 Create logo upload component in settings
- [ ] 24.2 Implement logo preview and crop
- [ ] 24.3 Add email configuration form
- [ ] 24.4 Implement SMTP connection test button

## 25. Mobile: Push Notifications

- [ ] 25.1 Add firebase_messaging dependency
- [ ] 25.2 Configure Firebase project for iOS and Android
- [ ] 25.3 Implement notification permission request
- [ ] 25.4 Create notification service for token management
- [ ] 25.5 Implement notification handling and routing
- [ ] 25.6 Add notification preferences screen

## 26. Mobile: Warehouse & Stock Features

- [ ] 26.1 Create warehouse selection screen
- [ ] 26.2 Implement warehouse persistence in storage
- [ ] 26.3 Create item details screen with stock info
- [ ] 26.4 Implement stock by warehouse display
- [ ] 26.5 Create bin stock view screen
- [ ] 26.6 Add bin search functionality

## 27. Mobile: Offline Conflict Detection

- [ ] 27.1 Add version tracking to synced entities
- [ ] 27.2 Implement conflict detection in sync manager
- [ ] 27.3 Create conflict notification UI
- [ ] 27.4 Implement conflict resolution screen
- [ ] 27.5 Add conflict resolution audit logging

## 28. Deployment Infrastructure

- [ ] 28.1 Create production Dockerfile with multi-stage build
- [ ] 28.2 Create docker-compose.yml for development
- [ ] 28.3 Create .env.example with all variables documented
- [ ] 28.4 Add health check endpoint to backend
- [ ] 28.5 Configure database migrations for production
- [ ] 28.6 Create database backup script
- [ ] 28.7 Create vercel.json for web deployment
- [ ] 28.8 Configure Android release build signing
- [ ] 28.9 Configure iOS release build settings
- [ ] 28.10 Write deployment documentation

## 29. Integration Testing

- [ ] 29.1 Write E2E tests for complete sales workflow
- [ ] 29.2 Write E2E tests for complete purchase workflow
- [ ] 29.3 Write E2E tests for stock management workflow
- [ ] 29.4 Perform performance testing for report generation
- [ ] 29.5 Perform load testing for concurrent users

---

## Summary

| Phase | Total | Completed | Remaining |
|-------|-------|-----------|-----------|
| Backend Infrastructure (1-3) | 29 | 26 | 3 |
| Backend Features (4-8) | 30 | 26 | 4 |
| Backend Documentation & Tests (9-11) | 21 | 1 | 20 |
| Web Frontend (12-24) | 56 | 16 | 40 |
| Mobile (25-27) | 16 | 0 | 16 |
| Deployment & Integration (28-29) | 15 | 0 | 15 |
| **Total** | **167** | **69** | **98** |

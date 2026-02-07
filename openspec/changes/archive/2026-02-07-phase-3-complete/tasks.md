# Phase 3 Complete - Implementation Tasks

## 1. File Upload Infrastructure (Backend)

- [x] 1.1 Create uploads module with Multer configuration
- [x] 1.2 Implement file validation service (type, size checks)
- [x] 1.3 Configure static file serving for uploads directory
- [x] 1.4 Add UPLOAD_DIR environment variable support
- [x] 1.5 Implement organization logo upload endpoint (POST /api/organizations/:id/logo)
- [x] 1.6 Implement organization logo delete endpoint (DELETE /api/organizations/:id/logo)
- [x] 1.7 Implement item image upload endpoint (POST /api/items/:id/images)
- [x] 1.8 Implement item image list endpoint (GET /api/items/:id/images)
- [x] 1.9 Implement item image delete endpoint (DELETE /api/items/:id/images/:imageId)
- [x] 1.10 Implement set primary image endpoint (PATCH /api/items/:id/images/:imageId)

## 2. File Upload UI (Web)

- [x] 2.1 Create reusable FileUpload component with drag-drop support
- [x] 2.2 Create ImagePreview component with delete action
- [x] 2.3 Implement logo upload in organization settings page
- [ ] 2.4 Implement item image gallery on item edit page
- [x] 2.5 Add upload progress indicator component

## 3. Bulk Import Infrastructure (Backend)

- [x] 3.1 Install csv-parse library and configure
- [x] 3.2 Create bulk import base service with transaction handling
- [x] 3.3 Implement item CSV import endpoint (POST /api/items/import)
- [x] 3.4 Implement item import template download (GET /api/items/import/template)
- [x] 3.5 Implement customer CSV import endpoint (POST /api/customers/import)
- [x] 3.6 Implement customer import template download (GET /api/customers/import/template)
- [x] 3.7 Implement vendor CSV import endpoint (POST /api/vendors/import)
- [x] 3.8 Implement vendor import template download (GET /api/vendors/import/template)
- [x] 3.9 Add validation error reporting with row numbers

## 4. Bulk Import UI (Web)

- [x] 4.1 Create BulkImportWizard component with multi-step flow
- [x] 4.2 Implement file upload step with CSV validation
- [x] 4.3 Implement column mapping preview step
- [x] 4.4 Implement validation results step with error display
- [x] 4.5 Implement import confirmation and progress step
- [x] 4.6 Add bulk import to Items page menu
- [x] 4.7 Add bulk import to Customers page menu
- [x] 4.8 Add bulk import to Vendors page menu

## 5. Item Variants (Backend)

- [x] 5.1 Create ItemVariant entity with attributes JSON column
- [x] 5.2 Create variant database migration
- [x] 5.3 Implement variant CRUD service methods
- [x] 5.4 Implement variant endpoints (GET/POST/PATCH/DELETE /api/items/:id/variants)
- [x] 5.5 Add variant stock tracking integration
- [x] 5.6 Implement variant pricing logic (override or inherit)
- [x] 5.7 Add variant support to sales order line items
- [x] 5.8 Update PDF generation to show variant attributes

## 6. Item Variants UI (Web)

- [x] 6.1 Create VariantForm component for adding/editing variants
- [x] 6.2 Create VariantList component showing all item variants
- [x] 6.3 Implement bulk variant creation (attribute combinations)
- [ ] 6.4 Add variant management tab to item detail page
- [ ] 6.5 Update sales order form to select variants when adding items
- [ ] 6.6 Show variant stock in item list aggregated view

## 7. Push Notifications (Backend)

- [x] 7.1 Install firebase-admin and configure FCM
- [x] 7.2 Create devices module with token storage
- [x] 7.3 Implement device registration endpoint (POST /api/devices/register)
- [x] 7.4 Implement device unregistration on logout
- [x] 7.5 Create notification service with FCM sending
- [x] 7.6 Implement notification preferences storage
- [x] 7.7 Add notification triggers for pick list creation
- [x] 7.8 Add notification triggers for low stock alerts
- [x] 7.9 Add notification triggers for GRN completion
- [x] 7.10 Implement notification delivery tracking

## 8. Mobile - Warehouse Selection

- [x] 8.1 Create warehouse selection screen UI
- [x] 8.2 Implement warehouse list API call
- [x] 8.3 Add warehouse selection persistence in local storage
- [ ] 8.4 Add warehouse change option in app header
- [ ] 8.5 Filter all queries by selected warehouse

## 9. Mobile - Item Details & Bin Stock

- [x] 9.1 Create item details screen with images
- [x] 9.2 Implement stock by bin display on item details
- [x] 9.3 Create bin stock view screen
- [x] 9.4 Implement bin contents API call
- [x] 9.5 Add navigation between item and bin screens
- [x] 9.6 Support variant display in item details

## 10. Mobile - Push Notifications

- [ ] 10.1 Add firebase_messaging dependency
- [ ] 10.2 Configure FCM in Android (google-services.json)
- [ ] 10.3 Configure FCM in iOS (GoogleService-Info.plist)
- [x] 10.4 Implement notification permission request
- [x] 10.5 Implement token registration with backend
- [x] 10.6 Handle foreground notifications with in-app banner
- [x] 10.7 Handle notification tap navigation

## 11. Mobile - Offline Conflict Detection

- [x] 11.1 Add version tracking to offline operations
- [x] 11.2 Implement conflict detection on sync
- [x] 11.3 Create conflict review UI screen
- [x] 11.4 Implement conflict resolution options (local/server/merge)
- [x] 11.5 Add conflict indicator banner in app

## 12. E2E Tests - Purchase Order Workflow

- [x] 12.1 Create PO workflow E2E test file
- [x] 12.2 Implement test: create PO and send to vendor
- [x] 12.3 Implement test: receive goods and create GRN
- [x] 12.4 Implement test: create bill from GRN
- [x] 12.5 Implement test: record payment on bill
- [x] 12.6 Implement test: partial receiving workflow

## 13. E2E Tests - Sales Workflow

- [x] 13.1 Create sales workflow E2E test file
- [x] 13.2 Implement test: create sales order
- [x] 13.3 Implement test: pick items and create shipment
- [x] 13.4 Implement test: generate invoice from order
- [x] 13.5 Implement test: receive payment on invoice
- [x] 13.6 Implement test: sales return and credit note

## 14. E2E Tests - Stock Management

- [x] 14.1 Create stock management E2E test file
- [x] 14.2 Implement test: stock adjustment creation and approval
- [x] 14.3 Implement test: stock transfer between bins
- [x] 14.4 Implement test: stock count with variance review
- [x] 14.5 Add test database seeding utilities

## 15. Performance & Load Testing

- [x] 15.1 Install k6 and create test scripts directory
- [x] 15.2 Create stock valuation report performance test
- [x] 15.3 Create sales by customer report performance test
- [x] 15.4 Create concurrent order creation load test
- [x] 15.5 Create concurrent stock update load test
- [x] 15.6 Add test result reporting configuration

## 16. OpenAPI Specification

- [x] 16.1 Configure @nestjs/swagger for spec export
- [ ] 16.2 Add missing swagger decorators to controllers
- [x] 16.3 Create openapi:generate npm script
- [ ] 16.4 Generate and validate openapi.json
- [ ] 16.5 Test SDK generation with openapi-generator

## 17. Production Docker Configuration

- [x] 17.1 Create Dockerfile.prod with multi-stage build
- [x] 17.2 Configure non-root user in container
- [x] 17.3 Add health check endpoint (/health)
- [x] 17.4 Create docker-compose.prod.yml
- [ ] 17.5 Test production build and startup

## 18. Environment & Migration Configuration

- [x] 18.1 Document all environment variables in .env.example
- [x] 18.2 Add startup validation for required variables
- [x] 18.3 Create migration:run npm script for production
- [x] 18.4 Create migration:revert npm script
- [x] 18.5 Create migration:status npm script
- [ ] 18.6 Test migration scripts independently

## 19. Web Deployment Configuration

- [x] 19.1 Configure Next.js for Vercel deployment
- [x] 19.2 Add NEXT_PUBLIC_API_URL environment handling
- [ ] 19.3 Create static export build script
- [ ] 19.4 Test Vercel deployment configuration

## 20. Mobile Build Configuration

- [x] 20.1 Configure Android release signing
- [ ] 20.2 Configure iOS release signing
- [x] 20.3 Create production environment config
- [ ] 20.4 Test release builds for both platforms

## 21. Deployment Documentation

- [x] 21.1 Create DEPLOYMENT.md with backend deployment guide
- [x] 21.2 Add database setup and migration instructions
- [x] 21.3 Add environment variable reference
- [x] 21.4 Add web deployment instructions
- [x] 21.5 Add mobile app release instructions
- [x] 21.6 Add troubleshooting section

---

**Summary: 108 tasks across 21 groups**

| Phase | Groups | Tasks |
|-------|--------|-------|
| A: Business Features | 1-6 | 46 |
| B: Mobile Completion | 8-11 | 20 |
| C: Testing & Quality | 12-15 | 24 |
| D: Deployment | 16-21 | 28 |

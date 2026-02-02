## 1. Project Setup & Infrastructure

- [x] 1.1 Initialize monorepo structure with `/backend`, `/web`, `/mobile` directories
- [x] 1.2 Setup backend NestJS project with TypeScript configuration
- [x] 1.3 Configure Prisma ORM with PostgreSQL connection
- [x] 1.4 Setup Next.js web project with App Router and TypeScript
- [x] 1.5 Configure Ant Design and TailwindCSS in web project
- [x] 1.6 Setup TanStack Query provider and API client with Axios
- [x] 1.7 Initialize Flutter mobile project with folder structure
- [x] 1.8 Configure Docker Compose for local PostgreSQL database
- [x] 1.9 Setup ESLint, Prettier for backend and web
- [x] 1.10 Configure environment variables for all projects

## 2. Database Schema & Prisma

- [x] 2.1 Design Prisma schema for organizations and users
- [x] 2.2 Design Prisma schema for roles and permissions
- [x] 2.3 Design Prisma schema for items, categories, and variants
- [x] 2.4 Design Prisma schema for customers and addresses
- [x] 2.5 Design Prisma schema for vendors and addresses
- [x] 2.6 Design Prisma schema for warehouses and bin locations
- [x] 2.7 Design Prisma schema for sales orders, lines, and related entities
- [x] 2.8 Design Prisma schema for invoices, payments, and credit notes
- [x] 2.9 Design Prisma schema for purchase orders, GRN, and bills
- [x] 2.10 Design Prisma schema for stock levels, movements, and adjustments
- [x] 2.11 Design Prisma schema for tax rates and number sequences
- [x] 2.12 Create initial Prisma migration
- [x] 2.13 Create seed script with sample data for development

## 3. Backend: Authentication Module

- [x] 3.1 Create auth module structure (controller, service, DTOs)
- [x] 3.2 Implement user login endpoint with JWT generation
- [x] 3.3 Implement refresh token rotation and cookie handling
- [x] 3.4 Implement logout endpoint with token invalidation
- [x] 3.5 Implement password reset request endpoint
- [x] 3.6 Implement password reset completion endpoint
- [x] 3.7 Create JWT strategy and auth guard
- [x] 3.8 Create organization context decorator and interceptor
- [ ] 3.9 Write unit tests for auth service
- [ ] 3.10 Write E2E tests for auth endpoints

## 4. Backend: User Management Module

- [x] 4.1 Create users module structure
- [x] 4.2 Implement user CRUD endpoints
- [x] 4.3 Implement predefined roles with permission sets
- [x] 4.4 Create roles guard for endpoint protection
- [x] 4.5 Implement user password change endpoint
- [x] 4.6 Implement user profile self-service endpoint
- [ ] 4.7 Write unit tests for user service
- [ ] 4.8 Write E2E tests for user endpoints

## 5. Backend: Organization Module

- [x] 5.1 Create organizations module structure
- [x] 5.2 Implement organization profile endpoints (GET/PUT)
- [ ] 5.3 Implement logo upload with file validation
- [x] 5.4 Implement tax rates CRUD endpoints
- [x] 5.5 Implement number sequence configuration
- [x] 5.6 Implement number sequence generation service
- [ ] 5.7 Write unit tests for organization service

## 6. Backend: Items Module

- [x] 6.1 Create items module structure
- [x] 6.2 Implement item CRUD endpoints
- [x] 6.3 Implement item search with filters and pagination
- [ ] 6.4 Implement item variants management
- [x] 6.5 Implement categories CRUD with hierarchy support
- [x] 6.6 Implement barcode lookup endpoint
- [ ] 6.7 Implement item image upload endpoints
- [x] 6.8 Implement item stock view endpoint
- [ ] 6.9 Implement bulk item import from CSV
- [ ] 6.10 Write unit tests for items service
- [ ] 6.11 Write E2E tests for items endpoints

## 7. Backend: Customers Module

- [x] 7.1 Create customers module structure
- [x] 7.2 Implement customer CRUD endpoints
- [x] 7.3 Implement customer code auto-generation
- [x] 7.4 Implement customer addresses management
- [x] 7.5 Implement customer contacts management
- [x] 7.6 Implement customer credit limit tracking
- [x] 7.7 Implement customer transaction history endpoint
- [ ] 7.8 Implement customer statement generation
- [ ] 7.9 Implement bulk customer import from CSV
- [ ] 7.10 Write unit tests for customers service

## 8. Backend: Vendors Module

- [x] 8.1 Create vendors module structure
- [x] 8.2 Implement vendor CRUD endpoints
- [x] 8.3 Implement vendor code auto-generation
- [x] 8.4 Implement vendor addresses management
- [x] 8.5 Implement vendor-item linking with pricing
- [x] 8.6 Implement vendor transaction history endpoint
- [ ] 8.7 Implement bulk vendor import from CSV
- [ ] 8.8 Write unit tests for vendors service

## 9. Backend: Warehouses Module

- [x] 9.1 Create warehouses module structure
- [x] 9.2 Implement warehouse CRUD endpoints
- [x] 9.3 Implement primary warehouse designation
- [x] 9.4 Implement bin location CRUD endpoints
- [x] 9.5 Implement warehouse stock summary endpoint
- [x] 9.6 Implement stock levels per item/bin queries
- [x] 9.7 Implement available vs committed stock calculation
- [ ] 9.8 Write unit tests for warehouses service

## 10. Backend: Sales Orders Module

- [x] 10.1 Create sales module structure
- [x] 10.2 Implement sales order CRUD endpoints
- [x] 10.3 Implement sales order line items management
- [x] 10.4 Implement tax calculation for orders
- [x] 10.5 Implement order-level discount application
- [x] 10.6 Implement sales order status transitions
- [x] 10.7 Implement stock allocation on order confirmation
- [x] 10.8 Implement pick list generation endpoint
- [x] 10.9 Implement pick list processing endpoints
- [ ] 10.10 Implement shipment creation endpoint
- [ ] 10.11 Implement delivery order PDF generation
- [ ] 10.12 Implement sales order PDF generation
- [ ] 10.13 Write unit tests for sales orders service
- [ ] 10.14 Write E2E tests for sales order workflow

## 11. Backend: Invoicing Module

- [x] 11.1 Create invoices module structure
- [x] 11.2 Implement invoice creation from sales order
- [x] 11.3 Implement direct invoice creation
- [x] 11.4 Implement invoice tax calculation (GST/SST)
- [x] 11.5 Implement invoice due date calculation
- [x] 11.6 Implement invoice status management
- [x] 11.7 Implement payment recording endpoints
- [ ] 11.8 Implement payment receipt PDF generation
- [ ] 11.9 Implement invoice PDF generation
- [x] 11.10 Implement invoice voiding endpoint
- [ ] 11.11 Write unit tests for invoicing service

## 12. Backend: Sales Returns Module

- [x] 12.1 Create sales returns module structure
- [x] 12.2 Implement sales return creation endpoint
- [x] 12.3 Implement return item validation
- [x] 12.4 Implement return inspection workflow
- [x] 12.5 Implement stock return to inventory
- [ ] 12.6 Implement credit note generation
- [ ] 12.7 Implement credit note application
- [x] 12.8 Write unit tests for sales returns service

## 13. Backend: Purchase Orders Module

- [x] 13.1 Create purchases module structure
- [x] 13.2 Implement purchase order CRUD endpoints
- [x] 13.3 Implement PO line items management
- [x] 13.4 Implement vendor price auto-fill
- [x] 13.5 Implement PO status transitions
- [ ] 13.6 Implement PO email sending endpoint
- [ ] 13.7 Implement PO PDF generation
- [x] 13.8 Implement reorder suggestions endpoint
- [ ] 13.9 Write unit tests for purchase orders service
- [ ] 13.10 Write E2E tests for PO workflow

## 14. Backend: Goods Receiving Module

- [x] 14.1 Create goods receiving module structure
- [x] 14.2 Implement GRN creation from PO
- [ ] 14.3 Implement direct GRN creation
- [x] 14.4 Implement partial receiving logic
- [x] 14.5 Implement over-receiving validation
- [x] 14.6 Implement bin assignment during receiving
- [x] 14.7 Implement stock update on GRN confirmation
- [ ] 14.8 Implement GRN printing endpoint
- [ ] 14.9 Write unit tests for goods receiving service

## 15. Backend: Purchase Bills Module

- [x] 15.1 Create bills module structure
- [x] 15.2 Implement bill creation from GRN
- [x] 15.3 Implement direct bill creation
- [x] 15.4 Implement three-way matching validation
- [x] 15.5 Implement bill payment recording
- [x] 15.6 Implement bill status management
- [ ] 15.7 Implement vendor credit notes handling
- [x] 15.8 Write unit tests for bills service

## 16. Backend: Stock Management Module

- [x] 16.1 Create inventory module structure
- [x] 16.2 Implement stock adjustment CRUD endpoints
- [x] 16.3 Implement adjustment type handling
- [x] 16.4 Implement adjustment confirmation with stock update
- [x] 16.5 Implement stock count creation endpoints
- [x] 16.6 Implement count sheet generation
- [x] 16.7 Implement count entry endpoints
- [x] 16.8 Implement variance calculation
- [x] 16.9 Implement adjustment generation from count
- [x] 16.10 Implement stock transfer endpoints
- [x] 16.11 Implement stock movement history endpoint
- [ ] 16.12 Write unit tests for stock management service

## 17. Backend: Reporting Module

- [x] 17.1 Create reports module structure
- [x] 17.2 Implement stock summary report endpoint
- [x] 17.3 Implement stock valuation report endpoint
- [x] 17.4 Implement low stock report endpoint
- [x] 17.5 Implement sales summary report endpoint
- [x] 17.6 Implement sales by customer report endpoint
- [x] 17.7 Implement sales by item report endpoint
- [x] 17.8 Implement outstanding receivables report endpoint
- [x] 17.9 Implement purchase summary report endpoint
- [x] 17.10 Implement outstanding payables report endpoint
- [x] 17.11 Implement PDF export for reports
- [ ] 17.12 Implement Excel export for reports
- [x] 17.13 Write unit tests for reports service

## 18. Backend: OpenAPI Documentation

- [x] 18.1 Configure Swagger/OpenAPI with NestJS
- [x] 18.2 Add API documentation for all endpoints
- [x] 18.3 Configure authentication in Swagger UI
- [ ] 18.4 Generate OpenAPI spec file for client generation

## 19. Web: Authentication & Layout

- [x] 19.1 Implement login page with form validation
- [x] 19.2 Implement forgot password page
- [x] 19.3 Implement password reset page
- [x] 19.4 Create auth context and hooks
- [x] 19.5 Implement token refresh interceptor
- [x] 19.6 Create protected route wrapper
- [x] 19.7 Implement main dashboard layout with sidebar
- [x] 19.8 Implement header with user menu and notifications
- [x] 19.9 Implement responsive sidebar navigation

## 20. Web: Dashboard

- [x] 20.1 Create dashboard page structure
- [x] 20.2 Implement today's sales widget
- [x] 20.3 Implement pending orders widget
- [x] 20.4 Implement low stock alerts widget
- [x] 20.5 Implement outstanding receivables widget
- [ ] 20.6 Implement recent activity feed
- [x] 20.7 Implement dashboard data refresh

## 21. Web: Items Management

- [x] 21.1 Create items list page with Ant Design table
- [x] 21.2 Implement items search and filters
- [x] 21.3 Implement item creation form/modal
- [x] 21.4 Implement item edit page
- [x] 21.5 Implement item details page with stock info
- [ ] 21.6 Implement item variants management UI
- [x] 21.7 Implement categories management page
- [ ] 21.8 Implement item image upload UI
- [ ] 21.9 Implement bulk import UI with CSV upload

## 22. Web: Customers Management

- [x] 22.1 Create customers list page
- [x] 22.2 Implement customer search and filters
- [x] 22.3 Implement customer creation form
- [x] 22.4 Implement customer edit page
- [ ] 22.5 Implement customer details page with transactions
- [ ] 22.6 Implement customer addresses management UI
- [ ] 22.7 Implement customer statement view/print

## 23. Web: Vendors Management

- [x] 23.1 Create vendors list page
- [x] 23.2 Implement vendor search and filters
- [x] 23.3 Implement vendor creation form
- [x] 23.4 Implement vendor edit page
- [ ] 23.5 Implement vendor details page with transactions
- [ ] 23.6 Implement vendor-item linking UI

## 24. Web: Warehouses Management

- [x] 24.1 Create warehouses list page
- [x] 24.2 Implement warehouse creation/edit forms
- [x] 24.3 Implement warehouse stock view
- [ ] 24.4 Implement bin locations management UI
- [ ] 24.5 Implement stock by bin view

## 25. Web: Sales Orders

- [x] 25.1 Create sales orders list page
- [x] 25.2 Implement sales order filters (status, date, customer)
- [x] 25.3 Implement sales order creation form with line items
- [x] 25.4 Implement item search/barcode in order form
- [x] 25.5 Implement price and discount editing in order form
- [x] 25.6 Implement order totals calculation display
- [x] 25.7 Implement sales order details page
- [x] 25.8 Implement order status transition actions
- [ ] 25.9 Implement pick list generation and view
- [ ] 25.10 Implement shipment creation modal
- [ ] 25.11 Implement order PDF preview and print

## 26. Web: Invoicing

- [x] 26.1 Create invoices list page
- [x] 26.2 Implement invoice creation from order
- [ ] 26.3 Implement direct invoice creation form
- [x] 26.4 Implement invoice details page
- [x] 26.5 Implement payment recording modal
- [ ] 26.6 Implement invoice PDF preview and print
- [ ] 26.7 Implement invoice email sending
- [ ] 26.8 Implement payments received list page

## 27. Web: Sales Returns

- [ ] 27.1 Create sales returns list page
- [ ] 27.2 Implement return creation from invoice
- [ ] 27.3 Implement return details page
- [ ] 27.4 Implement return inspection workflow UI
- [ ] 27.5 Implement credit note view and print

## 28. Web: Purchase Orders

- [x] 28.1 Create purchase orders list page
- [x] 28.2 Implement PO filters (status, vendor, date)
- [x] 28.3 Implement PO creation form with line items
- [x] 28.4 Implement vendor selection with item pricing
- [x] 28.5 Implement PO details page
- [x] 28.6 Implement PO status transition actions
- [ ] 28.7 Implement PO PDF preview and print
- [ ] 28.8 Implement PO email sending

## 29. Web: Goods Receiving

- [ ] 29.1 Create goods received list page
- [ ] 29.2 Implement GRN creation from PO
- [ ] 29.3 Implement receiving form with quantity entry
- [ ] 29.4 Implement bin assignment in receiving form
- [ ] 29.5 Implement GRN details page
- [ ] 29.6 Implement GRN print view

## 30. Web: Purchase Bills

- [ ] 30.1 Create bills list page
- [ ] 30.2 Implement bill creation from GRN
- [ ] 30.3 Implement bill details page
- [ ] 30.4 Implement payment recording modal
- [ ] 30.5 Implement payments made list page

## 31. Web: Stock Management

- [x] 31.1 Create stock adjustments list page
- [x] 31.2 Implement adjustment creation form
- [ ] 31.3 Implement adjustment details and approval
- [ ] 31.4 Create stock counts list page
- [ ] 31.5 Implement count creation wizard
- [ ] 31.6 Implement count entry form
- [ ] 31.7 Implement variance review page
- [x] 31.8 Implement stock transfers list page
- [x] 31.9 Implement transfer creation form

## 32. Web: Reports

- [x] 32.1 Create reports index page
- [x] 32.2 Implement stock summary report page
- [ ] 32.3 Implement stock valuation report page
- [x] 32.4 Implement low stock report page
- [x] 32.5 Implement sales summary report page
- [ ] 32.6 Implement sales by customer report page
- [x] 32.7 Implement outstanding receivables report page
- [x] 32.8 Implement purchase summary report page
- [x] 32.9 Implement outstanding payables report page
- [ ] 32.10 Implement PDF/Excel export buttons for all reports

## 33. Web: Settings

- [x] 33.1 Create settings page layout
- [x] 33.2 Implement organization profile form
- [ ] 33.3 Implement logo upload UI
- [x] 33.4 Implement tax rates management UI
- [x] 33.5 Implement number sequences configuration UI
- [x] 33.6 Implement users management page
- [x] 33.7 Implement user creation/edit modal
- [x] 33.8 Implement user role assignment UI

## 34. Mobile: Core Setup

- [x] 34.1 Configure Flutter project structure (features/core)
- [x] 34.2 Setup Riverpod for state management
- [x] 34.3 Configure Dio HTTP client with interceptors
- [ ] 34.4 Setup SQLite/Isar for offline storage
- [x] 34.5 Implement secure token storage
- [x] 34.6 Configure mobile_scanner for barcode scanning
- [ ] 34.7 Setup push notifications

## 35. Mobile: Authentication

- [x] 35.1 Implement login screen UI
- [x] 35.2 Implement login API integration
- [x] 35.3 Implement session persistence
- [x] 35.4 Implement logout functionality
- [ ] 35.5 Implement warehouse selection screen

## 36. Mobile: Stock Lookup

- [x] 36.1 Implement home screen with quick actions
- [x] 36.2 Implement item search screen
- [x] 36.3 Implement barcode scanner screen
- [ ] 36.4 Implement item details screen with stock
- [ ] 36.5 Implement bin stock view screen

## 37. Mobile: Pick List Processing

- [ ] 37.1 Implement pick lists list screen
- [ ] 37.2 Implement pick list details screen
- [ ] 37.3 Implement picking workflow with scanner
- [ ] 37.4 Implement pick quantity confirmation
- [ ] 37.5 Implement short pick handling
- [ ] 37.6 Implement pick list completion

## 38. Mobile: Goods Receiving

- [ ] 38.1 Implement open POs list screen
- [ ] 38.2 Implement receiving screen with items
- [ ] 38.3 Implement scan-to-receive workflow
- [ ] 38.4 Implement quantity entry and bin assignment
- [ ] 38.5 Implement GRN completion

## 39. Mobile: Stock Count

- [ ] 39.1 Implement stock counts list screen
- [ ] 39.2 Implement count session screen
- [ ] 39.3 Implement scan-and-count workflow
- [ ] 39.4 Implement count entry with variance display
- [ ] 39.5 Implement count submission

## 40. Mobile: Offline Support

- [ ] 40.1 Implement item data caching
- [ ] 40.2 Implement stock levels caching
- [ ] 40.3 Implement offline operation queue
- [ ] 40.4 Implement automatic sync on reconnect
- [ ] 40.5 Implement sync status indicators
- [ ] 40.6 Implement conflict detection and flagging

## 41. Integration & Testing

- [ ] 41.1 Setup E2E testing environment
- [ ] 41.2 Write E2E tests for complete sales workflow
- [ ] 41.3 Write E2E tests for complete purchase workflow
- [ ] 41.4 Write E2E tests for stock management workflow
- [ ] 41.5 Performance testing for report generation
- [ ] 41.6 Load testing for concurrent users

## 42. Deployment Preparation

- [ ] 42.1 Create production Dockerfile for backend
- [ ] 42.2 Configure production environment variables
- [ ] 42.3 Setup database migration scripts for production
- [ ] 42.4 Configure web deployment (Vercel or static hosting)
- [ ] 42.5 Prepare mobile app build configurations
- [ ] 42.6 Create deployment documentation

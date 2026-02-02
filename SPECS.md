# Inventory Management System (IMS) - Product Specification

## Target Market
**Malaysian SMEs - Auto Parts, Hardware & Spare Parts Wholesalers**

### Market Characteristics
- B2B-focused wholesale operations
- High SKU count (thousands of parts with variations)
- Part number/cross-reference requirements
- Credit-based customer relationships
- Multi-warehouse operations
- Import-heavy supply chains
- GST/SST tax compliance requirements

---

## 1. System Overview

### 1.1 Product Vision
A cloud-based inventory management system designed specifically for Malaysian auto parts, hardware, and spare parts wholesalers. The system enables efficient stock management, streamlined order processing, and comprehensive business operations tracking.

### 1.2 Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Node.js + NestJS + PostgreSQL + Prisma + OpenAPI/Swagger |
| Web App | Next.js + TanStack Query + Ant Design |
| Mobile App | Flutter (iOS & Android) |

### 1.3 Design Principles
- **Offline-first mobile**: Warehouse operations must work without constant connectivity
- **Barcode-centric**: All warehouse operations optimized for barcode scanning
- **Malaysian compliance**: Built-in GST/SST handling
- **B2B optimized**: Credit terms, bulk pricing, and wholesale workflows

---

## 2. Core Modules

### 2.1 Item Management

#### 2.1.1 Item Types
| Type | Description | Use Case |
|------|-------------|----------|
| **Simple Item** | Single product with no variations | Basic parts, consumables |
| **Item with Variants** | Product with attribute combinations | Parts in different sizes/colors |
| **Bundle/Kit** | Pre-defined group sold together | Service kits, repair sets |
| **Composite Item** | Assembled from components | Custom assemblies |

#### 2.1.2 Item Attributes
```
Basic Information:
- Item Code/SKU (auto-generated or manual)
- Item Name
- Description (short & long)
- Brand
- Category (hierarchical, up to 3 levels)
- Unit of Measure (UOM)
- Barcode (EAN-13, Code 128, QR Code)
- Images (multiple, up to 5)

Inventory Settings:
- Track Inventory (yes/no)
- Reorder Point
- Reorder Quantity
- Preferred Vendor
- Lead Time (days)

Pricing:
- Cost Price
- Selling Price
- Wholesale Price
- Minimum Selling Price
- Tax Rate (GST/SST)

Dimensions (for shipping):
- Weight (kg)
- Length, Width, Height (cm)

Auto Parts Specific:
- OEM Part Number
- Cross-Reference Numbers (multiple)
- Vehicle Compatibility (Make/Model/Year range)
- Superseded By (replacement part reference)
```

#### 2.1.3 Item Groups & Categories
- Hierarchical category structure (e.g., Engine Parts > Filters > Oil Filters)
- Custom attributes per category
- Bulk category assignment
- Category-based pricing rules

#### 2.1.4 Variant Management
- Attribute-based variants (Size, Color, Material, Grade)
- Matrix view for variant creation
- Individual SKU per variant
- Shared base pricing with variant adjustments

#### 2.1.5 Cross-Reference System
- OEM to aftermarket part mapping
- Multiple OEM numbers per item
- Interchange lookup
- Brand cross-reference

### 2.2 Inventory Control

#### 2.2.1 Stock Tracking
- Real-time stock levels per warehouse
- Available vs. committed stock
- Stock on order (incoming POs)
- Stock valuation (FIFO, Weighted Average)

#### 2.2.2 Multi-Warehouse Management
```
Warehouse Properties:
- Warehouse Code
- Name
- Address
- Contact Person
- Phone/Email
- Is Primary (yes/no)
- Active Status

Warehouse Features:
- Per-warehouse stock levels
- Warehouse-specific pricing (optional)
- Transfer orders between warehouses
- Warehouse-level permissions
```

#### 2.2.3 Bin/Location Management
- Location hierarchy (Zone > Aisle > Rack > Bin)
- Location codes (e.g., A-01-02-03)
- Default bin per item
- Multi-bin support per item
- Bin capacity tracking
- Pick path optimization

#### 2.2.4 Serial Number Tracking
- Auto-generate or manual entry
- Serial number history (movement tracking)
- Warranty tracking per serial
- Serial number lookup

#### 2.2.5 Batch/Lot Tracking
- Batch number assignment
- Expiry date tracking
- Batch-level cost tracking
- FIFO enforcement for batches
- Batch recall support

#### 2.2.6 Stock Adjustments
```
Adjustment Types:
- Stock Count (Physical inventory)
- Write-off (Damaged/Obsolete)
- Write-in (Found stock)
- Opening Stock
- Closing Adjustment

Adjustment Properties:
- Reference Number
- Date
- Warehouse
- Reason Code
- Items with quantities
- Notes
- Approval workflow (optional)
```

#### 2.2.7 Stock Transfers
- Transfer order creation
- Partial transfers
- In-transit tracking
- Transfer receipt confirmation
- Inter-warehouse reporting

#### 2.2.8 Stock Count/Cycle Count
- Full inventory count
- Cycle count by category/location
- Count sheets generation
- Variance reporting
- Adjustment approval workflow

### 2.3 Purchase Management

#### 2.3.1 Vendors/Suppliers
```
Vendor Information:
- Vendor Code
- Company Name
- Contact Person
- Email, Phone, Fax
- Billing Address
- Shipping Address
- Tax Registration Number
- Payment Terms (Net 30, etc.)
- Currency
- Credit Limit
- Bank Details

Vendor Features:
- Preferred items list
- Purchase history
- Vendor performance metrics
- Vendor price lists
- Multiple contacts per vendor
```

#### 2.3.2 Purchase Orders
```
PO Lifecycle:
Draft → Issued → Partially Received → Received → Billed → Closed

PO Properties:
- PO Number (auto-generated)
- Vendor
- Expected Delivery Date
- Warehouse (destination)
- Line Items (Item, Qty, Unit Price, Tax, Total)
- Shipping charges
- Discount (percentage or fixed)
- Notes
- Attachments

PO Features:
- Copy from previous PO
- Create from reorder suggestions
- Email PO to vendor
- PDF generation
- Partial receiving
- Over-receiving handling
- Cost variance tracking
```

#### 2.3.3 Goods Receiving (GRN)
- Receive against PO
- Direct receive (no PO)
- Partial receiving
- Quality inspection workflow
- Batch/Serial assignment at receiving
- Bin allocation
- Receive note printing

#### 2.3.4 Purchase Bills
- Create from received goods
- Bill matching (PO vs. Receipt vs. Bill)
- Multi-currency bills
- Tax handling
- Bill payment tracking
- Credit note from vendor

#### 2.3.5 Purchase Returns
- Return order creation
- Return reasons
- Credit note generation
- Stock deduction
- Vendor credit tracking

### 2.4 Sales Management

#### 2.4.1 Customers
```
Customer Information:
- Customer Code
- Company Name
- Contact Person
- Email, Phone
- Billing Address
- Shipping Addresses (multiple)
- Tax Registration Number
- Payment Terms
- Credit Limit
- Price List assignment
- Salesperson assignment

Customer Features:
- Customer groups/tiers
- Credit balance tracking
- Purchase history
- Outstanding invoices
- Statement generation
```

#### 2.4.2 Quotations
```
Quotation Lifecycle:
Draft → Sent → Accepted → Converted to SO / Declined / Expired

Features:
- Validity period
- Multiple revision support
- Convert to Sales Order
- Email to customer
- PDF generation
```

#### 2.4.3 Sales Orders
```
SO Lifecycle:
Draft → Confirmed → Picking → Packed → Shipped → Invoiced → Closed

SO Properties:
- SO Number (auto-generated)
- Customer
- Reference/PO Number (customer's)
- Order Date
- Expected Ship Date
- Warehouse (source)
- Line Items
- Discount (line-level and order-level)
- Shipping charges
- Tax calculation
- Notes
- Attachments

SO Features:
- Create from Quotation
- Backorder handling
- Partial fulfillment
- Split shipments
- Reserved stock allocation
- Delivery scheduling
```

#### 2.4.4 Pick Lists
- Generate from confirmed SOs
- Batch picking (multiple SOs)
- Wave picking
- Bin location sequence
- Pick confirmation (barcode scan)
- Short pick handling

#### 2.4.5 Packing
- Pack slip generation
- Package/carton management
- Weight recording
- Package labeling
- Multi-package shipments

#### 2.4.6 Shipments/Delivery Orders
- Delivery order creation
- Driver assignment
- Delivery routing
- Proof of delivery
- Delivery note printing
- Tracking number entry

#### 2.4.7 Invoicing
```
Invoice Sources:
- From Sales Order (after shipping)
- From Delivery Order
- Direct Invoice (walk-in sales)

Invoice Features:
- Tax calculation (GST/SST)
- Multi-currency support
- Payment terms
- Early payment discount
- Recurring invoice (for regular customers)
- E-invoice generation (future: MyInvois)
```

#### 2.4.8 Payment Collection
- Payment recording
- Multiple payment methods (Cash, Cheque, Bank Transfer, Credit Card)
- Partial payments
- Payment allocation to invoices
- Receipt generation
- Cheque tracking
- Bank reconciliation support

#### 2.4.9 Sales Returns (Credit Notes)
- Return authorization
- Return receiving
- Stock return to inventory
- Credit note generation
- Refund or credit balance
- Reason tracking

### 2.5 Price Management

#### 2.5.1 Price Lists
```
Price List Types:
- Standard Price List (default)
- Wholesale Price List
- Distributor Price List
- Customer-specific Price List
- Promotional Price List

Price List Properties:
- Name
- Currency
- Effective Date Range
- Customer/Customer Group assignment
- Percentage markup/markdown from base
- Item-specific overrides
```

#### 2.5.2 Pricing Features
- Quantity-based pricing (price breaks)
- Customer tier pricing
- Volume discounts
- Promotional pricing with date range
- Minimum order quantity
- Minimum order value

### 2.6 Reporting & Analytics

#### 2.6.1 Inventory Reports
| Report | Description |
|--------|-------------|
| Stock Summary | Current stock levels by item/warehouse |
| Stock Valuation | Inventory value by valuation method |
| Stock Movement | In/Out movements over period |
| Stock Aging | Age analysis of inventory |
| Reorder Report | Items below reorder point |
| Dead Stock | Slow/non-moving items |
| Batch Expiry | Upcoming batch expirations |

#### 2.6.2 Sales Reports
| Report | Description |
|--------|-------------|
| Sales Summary | Total sales by period |
| Sales by Customer | Sales breakdown per customer |
| Sales by Item | Best/worst selling items |
| Sales by Salesperson | Performance tracking |
| Sales by Category | Category-wise analysis |
| Profit Margin | Gross margin analysis |
| Outstanding Invoices | Receivables aging |

#### 2.6.3 Purchase Reports
| Report | Description |
|--------|-------------|
| Purchase Summary | Total purchases by period |
| Purchase by Vendor | Vendor-wise breakdown |
| Purchase by Item | Item-wise purchase history |
| Outstanding Bills | Payables aging |
| Vendor Performance | Lead time, quality metrics |

#### 2.6.4 Activity Reports
| Report | Description |
|--------|-------------|
| User Activity Log | Audit trail of all actions |
| Document History | Transaction modifications |
| Login History | User access tracking |

### 2.7 User Management & Permissions

#### 2.7.1 User Roles
```
Predefined Roles:
- Administrator (full access)
- Manager (most functions, limited settings)
- Sales Staff (sales functions only)
- Purchasing Staff (purchase functions only)
- Warehouse Staff (inventory operations only)
- Accountant (financial transactions only)
- Viewer (read-only access)

Custom Roles:
- Granular permission assignment
- Module-level access control
- Record-level restrictions (by warehouse, etc.)
```

#### 2.7.2 Permissions Matrix
```
Permission Categories:
- Items: View, Create, Edit, Delete, Adjust Cost
- Inventory: View Stock, Adjust, Transfer, Count
- Sales: View, Create, Edit, Delete, Invoice, Collect Payment
- Purchase: View, Create, Edit, Delete, Receive, Pay
- Reports: View specific reports
- Settings: Access organization settings
```

### 2.8 Settings & Configuration

#### 2.8.1 Organization Settings
- Company profile (Name, Logo, Address)
- Tax settings (GST/SST rates, registration number)
- Currency settings (base currency, exchange rates)
- Fiscal year settings
- Number sequences (SO, PO, Invoice numbering)

#### 2.8.2 Document Templates
- Invoice template customization
- Quotation template
- Purchase order template
- Delivery order template
- Receipt template

#### 2.8.3 Automation Rules
- Low stock alerts
- Reorder point notifications
- Payment overdue reminders
- Order confirmation emails
- Approval workflows

---

## 3. Key User Journeys

### 3.1 Journey: Setting Up a New Business

```
Actor: Business Owner / Administrator

Steps:
1. Sign up with email/password
2. Complete organization setup wizard
   - Company name, logo, address
   - Industry: Auto Parts / Hardware / Spare Parts
   - Base currency: MYR
   - Tax setup: GST/SST configuration
3. Configure warehouses
   - Add primary warehouse with address
   - Define bin locations (optional)
4. Set up basic item categories
   - Import predefined category templates for auto parts
   - Customize as needed
5. Import initial data
   - Vendors (CSV import)
   - Customers (CSV import)
   - Items with opening stock (CSV import)
6. Configure user accounts
   - Add staff members
   - Assign roles
7. Set up document templates
   - Add company logo to invoices
   - Customize footer text
```

### 3.2 Journey: Daily Sales Order Processing

```
Actor: Sales Staff

Steps:
1. Receive customer order (phone/WhatsApp/walk-in)
2. Create new Sales Order
   - Select customer (or create new)
   - Add items using:
     - Search by name/SKU
     - Barcode scan
     - Cross-reference lookup
   - System shows real-time stock availability
   - Apply customer's price list automatically
   - Add discount if applicable
3. Save and confirm Sales Order
   - Stock is committed/reserved
4. Print pick list
   - Sorted by bin location
5. Pass to warehouse for picking
```

### 3.3 Journey: Warehouse Picking & Packing

```
Actor: Warehouse Staff (using mobile app)

Steps:
1. Open assigned pick list on mobile device
2. Navigate to first bin location
3. Scan bin location barcode (verification)
4. Scan item barcode
5. Confirm picked quantity
6. System shows next pick location
7. Repeat until pick list complete
8. Handle exceptions:
   - Short pick: Enter actual qty, backorder created
   - Item not found: Flag for investigation
9. Move to packing station
10. Scan items into package
11. Record package weight
12. Print packing slip and shipping label
13. Mark shipment ready
```

### 3.4 Journey: Walk-in Counter Sale (Cash & Carry)

```
Actor: Counter Sales Staff

Steps:
1. Open Point of Sale / Quick Invoice screen
2. Scan or search items
3. Apply discounts if needed
4. Calculate total with tax
5. Collect payment
   - Cash: Enter amount, calculate change
   - Card: Process payment
   - Credit: Check customer credit limit
6. Generate and print receipt/invoice
7. Stock automatically deducted
```

### 3.5 Journey: Purchase Reordering

```
Actor: Purchasing Staff

Steps:
1. Review Reorder Report
   - Items below reorder point
   - Items with pending customer orders
2. Select items to reorder
3. System suggests preferred vendors
4. Create Purchase Order(s)
   - Group by vendor
   - Apply vendor price list
   - Set expected delivery date
5. Review and confirm PO
6. Email PO to vendor
7. Track PO status
```

### 3.6 Journey: Receiving Goods

```
Actor: Warehouse Staff

Steps:
1. Vendor delivers goods with delivery note
2. Open corresponding Purchase Order
3. Start Goods Receiving process
4. Scan or enter items:
   - Match against PO line items
   - Enter received quantity
   - Assign batch numbers (if applicable)
   - Assign bin locations
5. Handle discrepancies:
   - Short shipment: Partial receive
   - Damaged items: Reject quantity
   - Wrong items: Flag and note
6. Confirm receipt
7. Print Goods Received Note
8. Stock updated automatically
9. Create Purchase Bill (or flag for accounts)
```

### 3.7 Journey: Stock Take / Inventory Count

```
Actor: Warehouse Manager + Staff

Steps:
1. Schedule stock count
   - Full count or cycle count
   - Select warehouse/categories
2. Generate count sheets
   - By location or by category
3. Freeze affected stock (optional)
4. Conduct physical count:
   - Using printed sheets, or
   - Using mobile app with barcode scan
5. Enter counted quantities
6. System generates variance report:
   - Items with discrepancies
   - Value impact
7. Review and investigate variances
8. Manager approves adjustments
9. Stock levels updated
10. Generate stock count report
```

### 3.8 Journey: Customer Return Processing

```
Actor: Sales Staff / Warehouse Staff

Steps:
1. Customer requests return
2. Create Sales Return / Credit Note
   - Reference original invoice
   - Select items to return
   - Enter return reason
3. Customer brings items
4. Warehouse inspects items:
   - Good condition: Return to stock
   - Damaged: Write off
5. Confirm return receipt
6. Credit note generated
7. Apply credit to:
   - Outstanding invoice
   - Customer credit balance
   - Process refund
```

### 3.9 Journey: End of Day Reconciliation

```
Actor: Sales Manager / Accountant

Steps:
1. Review daily sales summary
2. Reconcile cash drawer
3. Review unpaid invoices
4. Process received payments
5. Review outstanding orders
6. Check backorder status
7. Generate daily reports:
   - Sales summary
   - Payment collection
   - Stock movement
8. Close day (optional feature)
```

### 3.10 Journey: Part Lookup (Auto Parts Specific)

```
Actor: Sales Staff

Steps:
1. Customer asks: "Do you have brake pads for Honda City 2020?"
2. Open Part Finder / Cross-Reference search
3. Search by:
   - Vehicle: Honda > City > 2020
   - Or OEM number if customer has it
4. System shows compatible parts:
   - Original part numbers
   - Aftermarket alternatives
   - Multiple brands with pricing
5. Check stock availability
6. Show customer options
7. Add selected item to order
```

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Requirement |
|--------|-------------|
| Page Load Time | < 2 seconds |
| Search Response | < 500ms |
| Report Generation | < 10 seconds for standard reports |
| Concurrent Users | Support 50+ simultaneous users |
| Data Volume | Handle 100,000+ items, 1M+ transactions |

### 4.2 Availability
- 99.5% uptime target
- Scheduled maintenance windows
- Automatic failover for critical services

### 4.3 Security
- HTTPS only
- JWT-based authentication
- Role-based access control (RBAC)
- Audit logging for all transactions
- Data encryption at rest
- Regular security updates

### 4.4 Scalability
- Horizontal scaling capability
- Database read replicas for reporting
- CDN for static assets
- Background job processing for heavy operations

### 4.5 Mobile Requirements
- Offline capability for core warehouse operations
- Data sync when connectivity restored
- Camera access for barcode scanning
- Push notifications for alerts

### 4.6 Localization
| Aspect | Support |
|--------|---------|
| Languages | English (primary), Bahasa Malaysia |
| Currency | MYR (primary), multi-currency support |
| Date Format | DD/MM/YYYY |
| Number Format | 1,234.56 |
| Tax | GST/SST compliance |

### 4.7 Integration Readiness
- RESTful API for all functions
- Webhook support for events
- OAuth 2.0 for third-party access
- Bulk import/export (CSV, Excel)

---

## 5. Data Models (High-Level)

### 5.1 Core Entities

```
Organization
├── Users
├── Warehouses
│   └── Bin Locations
├── Items
│   ├── Item Variants
│   ├── Item Categories
│   └── Cross References
├── Customers
│   └── Customer Addresses
├── Vendors
│   └── Vendor Addresses
├── Price Lists
│   └── Price List Items
└── Tax Rates

Transactions
├── Sales Orders
│   └── Sales Order Lines
├── Quotations
│   └── Quotation Lines
├── Invoices
│   └── Invoice Lines
├── Payments Received
├── Sales Returns
├── Purchase Orders
│   └── PO Lines
├── Goods Received Notes
│   └── GRN Lines
├── Purchase Bills
│   └── Bill Lines
├── Payments Made
├── Purchase Returns
├── Stock Adjustments
│   └── Adjustment Lines
├── Stock Transfers
│   └── Transfer Lines
└── Stock Counts
    └── Count Lines

Inventory
├── Stock Ledger (movements)
├── Batch Records
├── Serial Number Records
└── Stock Balance (per warehouse/bin)
```

### 5.2 Key Relationships
- Item → many Variants
- Item → many Categories (hierarchy)
- Item → many Cross References
- Item → many Vendors (preferred vendor list)
- Customer → one Price List
- Customer → many Addresses
- Sales Order → one Customer
- Sales Order → many Line Items
- Sales Order → many Invoices
- Invoice → many Payments
- Purchase Order → one Vendor
- Purchase Order → many GRNs
- GRN → many Bills
- Warehouse → many Bin Locations
- Item + Warehouse + Bin → Stock Balance

---

## 6. MVP Scope (Phase 1)

### 6.1 Implemented in MVP ✅
**Core Functions:**
- ✅ Organization setup and settings
- ✅ User authentication (JWT + refresh tokens)
- ✅ User profile management (Profile, Password, Organization settings)
- ✅ Item management (simple items, categories)
- ✅ Multi-warehouse stock management
- ✅ Stock levels per warehouse

**Sales:**
- ✅ Customer management (CRUD)
- ✅ Sales orders with stock allocation
- ✅ Invoicing from sales orders
- ✅ Payment collection

**Purchasing:**
- ✅ Vendor management (CRUD)
- ✅ Purchase orders
- ✅ Goods receiving (GRN via PO receive)

**Inventory:**
- ✅ Stock adjustments (ADD, SUBTRACT, DAMAGE, THEFT, CORRECTION, OTHER)
- ✅ Stock transfers between warehouses
- ✅ Stock movements history
- ✅ Stock levels by warehouse
- ✅ Low stock tracking

**Reporting:**
- ✅ Dashboard with stats (Today's Sales, Pending Orders, Low Stock, Receivables)
- ✅ Low stock alerts
- ✅ Recent activity feed
- ✅ Sales summary report
- ✅ Inventory summary report

**Mobile (Flutter):**
- ⏳ Shell structure created (pending full implementation)

### 6.2 Partially Implemented
- ⏳ User management UI (backend complete, frontend settings only - no user list/create UI)
- ⏳ Pick lists (backend complete, frontend pending)
- ⏳ Bills/Payments Made (backend complete, frontend pending)
- ⏳ Sales returns (backend complete, frontend pending)
- ⏳ Stock counts (backend complete, frontend pending)

### 6.3 Deferred to Phase 2
- Quotation management
- Batch tracking
- Serial number tracking
- Advanced bin management
- Customer portal
- Price lists and tiered pricing
- Backorder management
- Advanced reporting and analytics
- Automation rules
- E-invoicing (MyInvois)
- Full user management UI (add/edit/delete users)
- Full mobile app implementation
- Pick list UI
- Stock count UI
- Bills and payments made UI
- Sales returns UI

### 6.4 Deferred to Phase 3
- Multi-currency transactions
- Dropshipping
- Composite items / assemblies
- Vehicle compatibility database
- Advanced cross-reference system
- Marketplace integrations
- Accounting integration
- API for third-party access

---

## 7. API Structure (Backend)

### 7.1 API Modules (Implemented)
```
/api/v1
├── /auth
│   ├── POST /login
│   ├── POST /logout
│   └── POST /refresh
│
├── /organizations
│   └── GET /current
│
├── /users
│   ├── GET /                    # List users
│   ├── POST /                   # Create user
│   ├── GET /me                  # Current user profile
│   ├── PUT /me                  # Update profile
│   ├── POST /me/change-password # Change password
│   ├── GET /roles               # Available roles
│   ├── GET /:id                 # Get user
│   ├── PUT /:id                 # Update user
│   └── DELETE /:id              # Delete user
│
├── /items
│   ├── GET /                    # List items
│   ├── POST /                   # Create item
│   ├── GET /:id                 # Get item
│   ├── PUT /:id                 # Update item
│   └── DELETE /:id              # Delete item
│
├── /categories
│   ├── GET /                    # List categories
│   ├── POST /                   # Create category
│   ├── GET /:id                 # Get category
│   ├── PUT /:id                 # Update category
│   └── DELETE /:id              # Delete category
│
├── /warehouses
│   ├── GET /                    # List warehouses
│   ├── POST /                   # Create warehouse
│   ├── GET /:id                 # Get warehouse
│   ├── PUT /:id                 # Update warehouse
│   ├── DELETE /:id              # Delete warehouse
│   ├── GET /:id/stock           # Stock levels for warehouse
│   └── GET /:id/summary         # Stock summary for warehouse
│
├── /customers
│   ├── GET /                    # List customers
│   ├── POST /                   # Create customer
│   ├── GET /:id                 # Get customer
│   ├── PUT /:id                 # Update customer
│   └── DELETE /:id              # Delete customer
│
├── /vendors
│   ├── GET /                    # List vendors
│   ├── POST /                   # Create vendor
│   ├── GET /:id                 # Get vendor
│   ├── PUT /:id                 # Update vendor
│   └── DELETE /:id              # Delete vendor
│
├── /sales-orders
│   ├── GET /                    # List sales orders
│   ├── POST /                   # Create sales order
│   ├── GET /:id                 # Get sales order
│   ├── PUT /:id                 # Update sales order
│   ├── POST /:id/confirm        # Confirm order
│   └── POST /:id/cancel         # Cancel order
│
├── /pick-lists
│   ├── GET /                    # List pick lists
│   └── GET /:id                 # Get pick list
│
├── /invoices
│   ├── GET /                    # List invoices
│   ├── POST /                   # Create invoice
│   ├── GET /:id                 # Get invoice
│   ├── PUT /:id                 # Update invoice
│   └── POST /:id/send           # Mark as sent
│
├── /payments-received
│   ├── GET /                    # List payments
│   ├── POST /                   # Record payment
│   └── GET /:id                 # Get payment
│
├── /sales-returns
│   ├── GET /                    # List returns
│   ├── POST /                   # Create return
│   ├── GET /:id                 # Get return
│   └── POST /:id/confirm        # Confirm return
│
├── /purchase-orders
│   ├── GET /                    # List purchase orders
│   ├── POST /                   # Create purchase order
│   ├── GET /:id                 # Get purchase order
│   ├── PUT /:id                 # Update purchase order
│   ├── POST /:id/issue          # Issue PO
│   ├── POST /:id/receive        # Receive goods (GRN)
│   └── POST /:id/cancel         # Cancel PO
│
├── /bills
│   ├── GET /                    # List bills
│   ├── POST /                   # Create bill
│   ├── GET /:id                 # Get bill
│   └── POST /:id/payment        # Record payment
│
├── /stock-adjustments
│   ├── GET /                    # List adjustments
│   ├── POST /                   # Create adjustment
│   ├── GET /:id                 # Get adjustment
│   └── POST /:id/confirm        # Confirm adjustment
│
├── /stock-transfers
│   ├── GET /                    # List transfers
│   ├── POST /                   # Create transfer
│   ├── GET /:id                 # Get transfer
│   └── POST /:id/confirm        # Confirm transfer
│
├── /stock-counts
│   ├── GET /                    # List counts
│   ├── POST /                   # Create count
│   ├── GET /:id                 # Get count
│   ├── POST /:id/record         # Record counted quantities
│   └── POST /:id/complete       # Complete count
│
├── /stock-movements
│   └── GET /                    # List stock movements
│
├── /reports
│   ├── GET /sales-summary       # Sales report
│   ├── GET /inventory-summary   # Inventory report
│   ├── GET /purchase-summary    # Purchase report
│   ├── GET /receivables-summary # AR aging
│   └── GET /payables-summary    # AP aging
│
├── /dashboard
│   └── GET /stats               # Dashboard statistics
│
└── /settings
    └── (Organization settings via /organizations)
```

---

## 8. UI/UX Guidelines

### 8.1 Design System (Ant Design)
- Use Ant Design component library
- Consistent spacing (8px grid)
- Primary color: Blue (#1890ff) or customizable
- Support light/dark mode
- Responsive breakpoints: 576px, 768px, 992px, 1200px

### 8.2 Navigation Structure (Implemented)
```
Sidebar Navigation:
├── Dashboard
├── Sales
│   ├── Sales Orders
│   └── Invoices
├── Purchases
│   └── Purchase Orders
├── Inventory
│   ├── Items
│   ├── Categories
│   ├── Warehouses
│   ├── Stock Levels
│   ├── Stock Movements
│   ├── Stock Adjustments
│   └── Stock Transfers
├── Customers
├── Vendors
├── Reports
│   ├── Sales Report
│   └── Inventory Report
└── Settings
    ├── Profile
    ├── Password
    ├── Organization
    └── Notifications

Header:
├── Organization Name (left)
├── Notifications Bell (right)
└── User Dropdown (right)
    ├── Profile
    ├── Settings
    └── Logout
```

### 8.3 Common Patterns
- **List Views**: Table with filters, search, sort, pagination
- **Form Views**: Stepped forms for complex entries
- **Detail Views**: Header info + tabbed sections
- **Quick Actions**: Floating action buttons on mobile
- **Barcode Entry**: Dedicated input field with scan trigger

### 8.4 Dashboard Widgets
- Today's sales summary
- Pending orders count
- Low stock alerts
- Outstanding receivables
- Outstanding payables
- Recent activity feed

---

## 9. Glossary

| Term | Definition |
|------|------------|
| SKU | Stock Keeping Unit - unique identifier for each item |
| UOM | Unit of Measure - how items are counted (pcs, box, kg) |
| GRN | Goods Received Note - document confirming receipt of goods |
| PO | Purchase Order - document ordering goods from vendor |
| SO | Sales Order - document recording customer order |
| FIFO | First In First Out - inventory valuation method |
| GST | Goods and Services Tax (Malaysia) |
| SST | Sales and Services Tax (Malaysia) |
| Backorder | Order for out-of-stock items to be fulfilled later |
| Committed Stock | Stock reserved for pending orders |
| Available Stock | Stock that can be sold (on-hand minus committed) |
| Lead Time | Time between ordering and receiving goods |
| Reorder Point | Stock level that triggers reorder alert |
| Cross-Reference | Mapping between different part numbers for same item |
| OEM | Original Equipment Manufacturer |

---

## 10. Appendix

### 10.1 Malaysian Tax Reference
```
Current SST Rates (as of 2024):
- Sales Tax: 5%, 10% (depending on goods)
- Service Tax: 6%, 8%
- Exempt goods: Basic necessities, exported goods

Tax Registration:
- Mandatory for manufacturers with annual sales > RM500,000
- Service providers > RM500,000 annual revenue

E-Invoicing (MyInvois):
- Mandatory rollout starting 2024 for large companies
- SMEs phased in by 2025-2026
```

### 10.2 Common Auto Parts Categories
```
- Engine Parts (Filters, Gaskets, Belts, Hoses)
- Brake System (Pads, Rotors, Calipers)
- Suspension (Shock Absorbers, Bushings, Ball Joints)
- Electrical (Batteries, Alternators, Starters, Bulbs)
- Body Parts (Mirrors, Lights, Bumpers)
- Fluids & Chemicals (Oil, Coolant, Brake Fluid)
- Accessories (Floor Mats, Seat Covers)
- Tools & Equipment
```

### 10.3 Common Hardware Categories
```
- Fasteners (Screws, Bolts, Nuts, Washers)
- Hand Tools (Wrenches, Pliers, Screwdrivers)
- Power Tools (Drills, Grinders, Saws)
- Plumbing (Pipes, Fittings, Valves)
- Electrical (Wires, Switches, Outlets)
- Building Materials (Cement, Sand, Steel)
- Safety Equipment (Gloves, Helmets, Goggles)
- Paints & Finishes
```

---

## 11. Development Setup

### 11.1 Quick Start Scripts
The `scripts/` folder contains utility scripts for managing the application:

| Script | Description |
|--------|-------------|
| `launcher.bat` | Interactive menu with all options |
| `start-web.bat` | Start PostgreSQL + Backend + Web Frontend |
| `start-mobile.bat` | Start PostgreSQL + Backend + Flutter App |
| `stop-all.bat` | Shutdown all services |

See `scripts/README.md` for detailed documentation.

### 11.2 Service Ports
| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | localhost:5432 |
| Backend API | 3001 | http://localhost:3001/api/v1 |
| Web Frontend | 3000 | http://localhost:3000 |
| pgAdmin | 5050 | http://localhost:5050 |

### 11.3 Default Credentials
**Demo User:**
- Email: `admin@demoautoparts.com`
- Password: `admin123`

**pgAdmin:**
- Email: `admin@ims.local`
- Password: `admin`

### 11.4 Tech Stack Versions
| Component | Version |
|-----------|---------|
| Node.js | 18+ |
| PostgreSQL | 15 (via Docker) |
| Next.js | 14.1.0 |
| NestJS | 10.x |
| Flutter | 3.2+ |
| Ant Design | 5.x |
| TanStack Query | 5.x |

---

## 12. Testing Status

### 12.1 Tested Features ✅
| Module | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ Passed | Login, logout, token refresh |
| User Profile | ✅ Passed | Profile, password, settings |
| Item Management | ✅ Passed | CRUD operations |
| Category Management | ✅ Passed | CRUD operations |
| Customer Management | ✅ Passed | CRUD operations |
| Vendor Management | ✅ Passed | CRUD operations |
| Warehouse Management | ✅ Passed | CRUD, stock levels |
| Sales Orders | ✅ Passed | Create, confirm, view |
| Invoices | ✅ Passed | Create from SO, view |
| Purchase Orders | ✅ Passed | Create, receive (GRN) |
| Stock Levels | ✅ Passed | View by warehouse |
| Stock Movements | ✅ Passed | Movement history |
| Stock Adjustments | ✅ Passed | Create adjustments |
| Reports | ✅ Passed | Sales & Inventory reports |
| Dashboard | ✅ Passed | Stats, alerts, activity |
| Navigation | ✅ Passed | Sidebar, menus, routing |

### 12.2 Known Issues
- Stock adjustment creation requires backend to be fully stable
- Session may require re-login after extended idle time

---

*Document Version: 1.1*
*Last Updated: January 2026*
*Status: MVP Implementation Complete - Testing Passed*
